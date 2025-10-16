from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Cookie, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import httpx
from passlib.context import CryptContext
import secrets
import re

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class User(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    picture: Optional[str] = None
    password_hash: Optional[str] = None  # For email/password auth
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    class Config:
        populate_by_name = True

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Book(BaseModel):
    isbn: str
    title: str
    author: str
    coverImage: Optional[str] = None
    totalPages: int
    currentPage: int = 0
    status: str = "want_to_read"
    progress: float = 0.0
    dateAdded: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    dateFinished: Optional[datetime] = None
    notes: Optional[str] = None
    rating: Optional[int] = None
    user_id: Optional[str] = None  # Link books to users

class BookResponse(Book):
    id: str

class BookUpdate(BaseModel):
    currentPage: Optional[int] = None
    status: Optional[str] = None
    dateFinished: Optional[datetime] = None
    notes: Optional[str] = None
    rating: Optional[int] = None

class GoogleBookInfo(BaseModel):
    title: str
    author: str
    coverImage: Optional[str] = None
    totalPages: int
    isbn: str

class ReadingStats(BaseModel):
    total_books: int
    books_read: int
    books_reading: int
    books_to_read: int
    total_pages_read: int
    average_progress: float
    books_by_month: dict


# Helper functions
def book_helper(book) -> dict:
    return {
        "id": str(book["_id"]),
        "isbn": book["isbn"],
        "title": book["title"],
        "author": book["author"],
        "coverImage": book.get("coverImage"),
        "totalPages": book["totalPages"],
        "currentPage": book["currentPage"],
        "status": book["status"],
        "progress": book["progress"],
        "dateAdded": book["dateAdded"],
        "dateFinished": book.get("dateFinished"),
        "notes": book.get("notes"),
        "rating": book.get("rating"),
        "user_id": book.get("user_id")
    }

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token in cookie or Authorization header"""
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.replace("Bearer ", "")
    
    if not session_token:
        return None
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": session_token})
    if not session:
        return None
    
    # Check expiry
    if session["expires_at"] < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        return None
    
    # Get user
    user_doc = await db.users.find_one({"_id": session["user_id"]})
    if not user_doc:
        return None
    
    user_doc["id"] = str(user_doc.pop("_id"))
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    """Require authentication"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    """Register with email/password"""
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = f"user_{secrets.token_urlsafe(16)}"
    password_hash = pwd_context.hash(user_data.password)
    
    await db.users.insert_one({
        "_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    return {"id": user_id, "email": user_data.email, "name": user_data.name}

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    """Login with email/password"""
    user = await db.users.find_one({"email": credentials.email})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not pwd_context.verify(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({
        "user_id": user["_id"],
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture")
    }

@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    """Process session_id from Emergent Auth"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="No session_id provided")
    
    # Get session data from Emergent
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            resp.raise_for_status()
            session_data = resp.json()
        except Exception as e:
            logging.error(f"Error fetching session data: {e}")
            raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check if user exists
    user = await db.users.find_one({"email": session_data["email"]})
    
    if not user:
        # Create new user
        user_id = f"user_{secrets.token_urlsafe(16)}"
        await db.users.insert_one({
            "_id": user_id,
            "email": session_data["email"],
            "name": session_data["name"],
            "picture": session_data.get("picture"),
            "created_at": datetime.now(timezone.utc)
        })
    else:
        user_id = user["_id"]
    
    # Create our session
    our_session_token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": our_session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=our_session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    return {
        "id": str(user_id),
        "email": session_data["email"],
        "name": session_data["name"],
        "picture": session_data.get("picture"),
        "session_token": our_session_token
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current user"""
    user = await require_auth(request)
    return {"id": user.id, "email": user.email, "name": user.name, "picture": user.picture}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}


# Enhanced Book Search with multiple APIs
@api_router.get("/books/search/{isbn}", response_model=GoogleBookInfo)
async def search_book_by_isbn(isbn: str):
    """Fetch book information from multiple APIs"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        headers = {"User-Agent": "BookTracker/1.0"}
        
        # Try Google Books API first
        try:
            response = await client.get(
                f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if "items" in data and len(data["items"]) > 0:
                    book_data = data["items"][0]["volumeInfo"]
                    cover_url = None
                    if "imageLinks" in book_data:
                        cover_url = book_data["imageLinks"].get("thumbnail") or book_data["imageLinks"].get("smallThumbnail")
                    
                    if not cover_url:
                        cover_url = f"https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg"
                    
                    return GoogleBookInfo(
                        title=book_data.get("title", "Unknown Title"),
                        author=", ".join(book_data.get("authors", ["Unknown Author"])),
                        coverImage=cover_url,
                        totalPages=book_data.get("pageCount", 0),
                        isbn=isbn
                    )
        except Exception as e:
            logging.error(f"Google Books API error: {e}")
        
        # Try Open Library
        try:
            ol_response = await client.get(
                f"https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&jscmd=data&format=json"
            )
            ol_data = ol_response.json()
            
            if f"ISBN:{isbn}" in ol_data and ol_data[f"ISBN:{isbn}"]:
                book_data = ol_data[f"ISBN:{isbn}"]
                cover_url = f"https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg"
                
                return GoogleBookInfo(
                    title=book_data.get("title", "Unknown Title"),
                    author=", ".join([author["name"] for author in book_data.get("authors", [])]) or "Unknown Author",
                    coverImage=cover_url,
                    totalPages=book_data.get("number_of_pages", 0),
                    isbn=isbn
                )
        except Exception as e:
            logging.error(f"Open Library API error: {e}")
        
        # Try DNB (Deutsche Nationalbibliothek) SRU API for German books
        try:
            import xmltodict
            import re as regex_module
            
            # DNB SRU API endpoint
            dnb_sru_url = f"https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&query=num%3D{isbn}&recordSchema=oai_dc&maximumRecords=1"
            
            dnb_response = await client.get(dnb_sru_url, headers=headers, timeout=15.0)
            
            if dnb_response.status_code == 200:
                # Parse XML response
                dnb_data = xmltodict.parse(dnb_response.text, process_namespaces=False)
                
                # Navigate through the XML structure (without namespace prefix)
                records = dnb_data.get('searchRetrieveResponse', {}).get('records', {})
                
                logging.info(f"DNB records structure: {records is not None}")
                
                if records and records.get('record'):
                    record = records['record']
                    record_data = record.get('recordData', {}).get('dc', {})
                    
                    # Extract book information
                    title = None
                    author = None
                    pages = None
                    
                    # Title - clean up the DNB format
                    if 'dc:title' in record_data:
                        title_data = record_data['dc:title']
                        if isinstance(title_data, list):
                            title = title_data[0]
                        else:
                            title = title_data
                        
                        # Clean up title: remove [Author] prefix and / separators
                        if title:
                            # Remove [Author] prefix like "[Rowling] ;"
                            title = re.sub(r'^\[.*?\]\s*;\s*', '', title)
                            # If there's a / separator, take the part before it (main title)
                            if ' / ' in title:
                                title = title.split(' / ')[0].strip()
                    
                    # Author/Creator
                    if 'dc:creator' in record_data:
                        creator_data = record_data['dc:creator']
                        if isinstance(creator_data, list):
                            author = ', '.join(creator_data)
                        else:
                            author = creator_data
                    
                    # Try to get page count from format/extent
                    if 'dc:format' in record_data:
                        format_data = record_data['dc:format']
                        format_list = format_data if isinstance(format_data, list) else [format_data]
                        for fmt in format_list:
                            if 'Seiten' in str(fmt) or 'S.' in str(fmt):
                                # Extract number from strings like "320 Seiten" or "320 S."
                                import re
                                page_match = re.search(r'(\d+)\s*(?:Seiten|S\.)', str(fmt))
                                if page_match:
                                    pages = int(page_match.group(1))
                                    break
                    
                    if title:
                        logging.info(f"DNB found book: {title} by {author}")
                        return GoogleBookInfo(
                            title=title,
                            author=author or "Unbekannter Autor",
                            coverImage=f"https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg",
                            totalPages=pages or 250,
                            isbn=isbn
                        )
        except Exception as e:
            logging.error(f"DNB SRU API error: {e}")
        
        # Final fallback - return basic info with ISBN
        logging.info(f"Book with ISBN {isbn} not found in any API, returning basic info")
        return GoogleBookInfo(
            title=f"Book - {isbn}",
            author="Unknown Author",
            coverImage=f"https://covers.openlibrary.org/b/isbn/{isbn}-M.jpg",
            totalPages=250,
            isbn=isbn
        )


# Book endpoints (now with user context)
@api_router.post("/books", response_model=BookResponse)
async def add_book(book: Book, request: Request):
    """Add a new book"""
    user = await get_current_user(request)
    book_dict = book.dict()
    
    if user:
        book_dict["user_id"] = user.id
    
    result = await db.books.insert_one(book_dict)
    book_dict["_id"] = result.inserted_id
    return book_helper(book_dict)

@api_router.get("/books", response_model=List[BookResponse])
async def get_all_books(request: Request, search: Optional[str] = None):
    """Get all books with optional search"""
    user = await get_current_user(request)
    
    query = {}
    if user:
        query["user_id"] = user.id
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"author": {"$regex": search, "$options": "i"}},
            {"isbn": {"$regex": search, "$options": "i"}}
        ]
    
    books = await db.books.find(query).to_list(1000)
    return [book_helper(book) for book in books]

@api_router.get("/books/status/{status}", response_model=List[BookResponse])
async def get_books_by_status(status: str, request: Request):
    """Get books by status"""
    user = await get_current_user(request)
    
    query = {"status": status}
    if user:
        query["user_id"] = user.id
    
    books = await db.books.find(query).to_list(1000)
    return [book_helper(book) for book in books]

@api_router.get("/books/{book_id}", response_model=BookResponse)
async def get_book(book_id: str, request: Request):
    """Get a single book"""
    user = await get_current_user(request)
    
    try:
        query = {"_id": ObjectId(book_id)}
        if user:
            query["user_id"] = user.id
        
        book = await db.books.find_one(query)
        if book:
            return book_helper(book)
        raise HTTPException(status_code=404, detail="Book not found")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid book ID")

@api_router.put("/books/{book_id}", response_model=BookResponse)
async def update_book(book_id: str, book_update: BookUpdate, request: Request):
    """Update book"""
    user = await get_current_user(request)
    
    try:
        query = {"_id": ObjectId(book_id)}
        if user:
            query["user_id"] = user.id
        
        book = await db.books.find_one(query)
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        update_data = {}
        
        if book_update.currentPage is not None:
            update_data["currentPage"] = book_update.currentPage
            if book["totalPages"] > 0:
                progress = (book_update.currentPage / book["totalPages"]) * 100
                update_data["progress"] = min(progress, 100)
        
        if book_update.status is not None:
            update_data["status"] = book_update.status
            if book_update.status == "read":
                update_data["currentPage"] = book["totalPages"]
                update_data["progress"] = 100
                update_data["dateFinished"] = datetime.now(timezone.utc)
        
        if book_update.dateFinished is not None:
            update_data["dateFinished"] = book_update.dateFinished
        
        if book_update.notes is not None:
            update_data["notes"] = book_update.notes
        
        if book_update.rating is not None:
            update_data["rating"] = book_update.rating
        
        await db.books.update_one(query, {"$set": update_data})
        updated_book = await db.books.find_one(query)
        return book_helper(updated_book)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid book ID")

@api_router.delete("/books/{book_id}")
async def delete_book(book_id: str, request: Request):
    """Delete a book"""
    user = await get_current_user(request)
    
    try:
        query = {"_id": ObjectId(book_id)}
        if user:
            query["user_id"] = user.id
        
        result = await db.books.delete_one(query)
        if result.deleted_count == 1:
            return {"message": "Book deleted successfully"}
        raise HTTPException(status_code=404, detail="Book not found")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid book ID")

@api_router.get("/stats", response_model=ReadingStats)
async def get_reading_stats(request: Request):
    """Get reading statistics"""
    user = await get_current_user(request)
    
    query = {}
    if user:
        query["user_id"] = user.id
    
    all_books = await db.books.find(query).to_list(1000)
    
    total_books = len(all_books)
    books_read = len([b for b in all_books if b["status"] == "read"])
    books_reading = len([b for b in all_books if b["status"] == "currently_reading"])
    books_to_read = len([b for b in all_books if b["status"] == "want_to_read"])
    
    total_pages_read = sum(
        b["currentPage"] for b in all_books if b["status"] in ["read", "currently_reading"]
    )
    
    avg_progress = sum(b["progress"] for b in all_books) / total_books if total_books > 0 else 0
    
    # Books by month
    books_by_month = {}
    for book in all_books:
        if book.get("dateFinished"):
            month_key = book["dateFinished"].strftime("%Y-%m")
            books_by_month[month_key] = books_by_month.get(month_key, 0) + 1
    
    return ReadingStats(
        total_books=total_books,
        books_read=books_read,
        books_reading=books_reading,
        books_to_read=books_to_read,
        total_pages_read=total_pages_read,
        average_progress=round(avg_progress, 1),
        books_by_month=books_by_month
    )


# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
