from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class Book(BaseModel):
    isbn: str
    title: str
    author: str
    coverImage: Optional[str] = None
    totalPages: int
    currentPage: int = 0
    status: str = "want_to_read"  # read, currently_reading, want_to_read
    progress: float = 0.0
    dateAdded: datetime = Field(default_factory=datetime.utcnow)
    dateFinished: Optional[datetime] = None

class BookResponse(Book):
    id: str

class BookUpdate(BaseModel):
    currentPage: Optional[int] = None
    status: Optional[str] = None
    dateFinished: Optional[datetime] = None

class GoogleBookInfo(BaseModel):
    title: str
    author: str
    coverImage: Optional[str] = None
    totalPages: int
    isbn: str


# Helper function to convert MongoDB doc to response
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
        "dateFinished": book.get("dateFinished")
    }


# Google Books API endpoint
@api_router.get("/books/search/{isbn}", response_model=GoogleBookInfo)
async def search_book_by_isbn(isbn: str):
    """Fetch book information from Google Books API"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Try Google Books API first
            headers = {
                "User-Agent": "BookTracker/1.0"
            }
            response = await client.get(
                f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}",
                headers=headers
            )
            
            logging.info(f"Google Books API response status: {response.status_code}")
            
            if response.status_code == 403:
                # Rate limited or blocked, try Open Library API
                logging.info("Google Books API blocked, trying Open Library")
                ol_response = await client.get(
                    f"https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&jscmd=data&format=json"
                )
                ol_data = ol_response.json()
                
                if f"ISBN:{isbn}" not in ol_data or not ol_data[f"ISBN:{isbn}"]:
                    raise HTTPException(status_code=404, detail="Book not found")
                
                book_data = ol_data[f"ISBN:{isbn}"]
                
                # Extract cover image and convert to base64 if available
                cover_url = None
                if "cover" in book_data and "large" in book_data["cover"]:
                    cover_url = book_data["cover"]["large"]
                elif "cover" in book_data and "medium" in book_data["cover"]:
                    cover_url = book_data["cover"]["medium"]
                
                cover_base64 = None
                if cover_url:
                    try:
                        img_response = await client.get(cover_url)
                        if img_response.status_code == 200:
                            import base64
                            cover_base64 = f"data:image/jpeg;base64,{base64.b64encode(img_response.content).decode('utf-8')}"
                    except Exception as e:
                        logging.error(f"Error fetching cover image: {e}")
                
                return GoogleBookInfo(
                    title=book_data.get("title", "Unknown Title"),
                    author=", ".join([author["name"] for author in book_data.get("authors", [])]) or "Unknown Author",
                    coverImage=cover_base64,
                    totalPages=book_data.get("number_of_pages", 0),
                    isbn=isbn
                )
            
            data = response.json()
            
            if "items" not in data or len(data["items"]) == 0:
                # Try Open Library as fallback
                logging.info("Book not found in Google Books, trying Open Library")
                ol_response = await client.get(
                    f"https://openlibrary.org/api/books?bibkeys=ISBN:{isbn}&jscmd=data&format=json"
                )
                ol_data = ol_response.json()
                
                if f"ISBN:{isbn}" not in ol_data or not ol_data[f"ISBN:{isbn}"]:
                    raise HTTPException(status_code=404, detail="Book not found")
                
                book_data = ol_data[f"ISBN:{isbn}"]
                
                # Extract cover image and convert to base64 if available
                cover_url = None
                if "cover" in book_data and "large" in book_data["cover"]:
                    cover_url = book_data["cover"]["large"]
                elif "cover" in book_data and "medium" in book_data["cover"]:
                    cover_url = book_data["cover"]["medium"]
                
                cover_base64 = None
                if cover_url:
                    try:
                        img_response = await client.get(cover_url)
                        if img_response.status_code == 200:
                            import base64
                            cover_base64 = f"data:image/jpeg;base64,{base64.b64encode(img_response.content).decode('utf-8')}"
                    except Exception as e:
                        logging.error(f"Error fetching cover image: {e}")
                
                return GoogleBookInfo(
                    title=book_data.get("title", "Unknown Title"),
                    author=", ".join([author["name"] for author in book_data.get("authors", [])]) or "Unknown Author",
                    coverImage=cover_base64,
                    totalPages=book_data.get("number_of_pages", 0),
                    isbn=isbn
                )
            
            book_data = data["items"][0]["volumeInfo"]
            
            # Extract cover image and convert to base64 if available
            cover_url = None
            if "imageLinks" in book_data:
                cover_url = book_data["imageLinks"].get("thumbnail") or book_data["imageLinks"].get("smallThumbnail")
            
            cover_base64 = None
            if cover_url:
                try:
                    # Download the image
                    cover_url = cover_url.replace("http://", "https://")  # Use HTTPS
                    img_response = await client.get(cover_url)
                    if img_response.status_code == 200:
                        import base64
                        cover_base64 = f"data:image/jpeg;base64,{base64.b64encode(img_response.content).decode('utf-8')}"
                except Exception as e:
                    logging.error(f"Error fetching cover image: {e}")
            
            return GoogleBookInfo(
                title=book_data.get("title", "Unknown Title"),
                author=", ".join(book_data.get("authors", ["Unknown Author"])),
                coverImage=cover_base64,
                totalPages=book_data.get("pageCount", 0),
                isbn=isbn
            )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching book data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching book data: {str(e)}")


# CRUD endpoints for books
@api_router.post("/books", response_model=BookResponse)
async def add_book(book: Book):
    """Add a new book to the library"""
    book_dict = book.dict()
    result = await db.books.insert_one(book_dict)
    book_dict["_id"] = result.inserted_id
    return book_helper(book_dict)


@api_router.get("/books", response_model=List[BookResponse])
async def get_all_books():
    """Get all books"""
    books = await db.books.find().to_list(1000)
    return [book_helper(book) for book in books]


@api_router.get("/books/status/{status}", response_model=List[BookResponse])
async def get_books_by_status(status: str):
    """Get books by status (read, currently_reading, want_to_read)"""
    books = await db.books.find({"status": status}).to_list(1000)
    return [book_helper(book) for book in books]


@api_router.get("/books/{book_id}", response_model=BookResponse)
async def get_book(book_id: str):
    """Get a single book by ID"""
    try:
        book = await db.books.find_one({"_id": ObjectId(book_id)})
        if book:
            return book_helper(book)
        raise HTTPException(status_code=404, detail="Book not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid book ID")


@api_router.put("/books/{book_id}", response_model=BookResponse)
async def update_book(book_id: str, book_update: BookUpdate):
    """Update book progress and status"""
    try:
        # Get the current book
        book = await db.books.find_one({"_id": ObjectId(book_id)})
        if not book:
            raise HTTPException(status_code=404, detail="Book not found")
        
        update_data = {}
        
        # Update current page and calculate progress
        if book_update.currentPage is not None:
            update_data["currentPage"] = book_update.currentPage
            total_pages = book["totalPages"]
            if total_pages > 0:
                progress = (book_update.currentPage / total_pages) * 100
                update_data["progress"] = min(progress, 100)
        
        # Update status
        if book_update.status is not None:
            update_data["status"] = book_update.status
            # If marked as read, set current page to total pages and progress to 100
            if book_update.status == "read":
                update_data["currentPage"] = book["totalPages"]
                update_data["progress"] = 100
                update_data["dateFinished"] = datetime.utcnow()
        
        # Update date finished
        if book_update.dateFinished is not None:
            update_data["dateFinished"] = book_update.dateFinished
        
        # Perform the update
        await db.books.update_one(
            {"_id": ObjectId(book_id)},
            {"$set": update_data}
        )
        
        # Return updated book
        updated_book = await db.books.find_one({"_id": ObjectId(book_id)})
        return book_helper(updated_book)
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating book: {e}")
        raise HTTPException(status_code=400, detail="Invalid book ID or update data")


@api_router.delete("/books/{book_id}")
async def delete_book(book_id: str):
    """Delete a book from the library"""
    try:
        result = await db.books.delete_one({"_id": ObjectId(book_id)})
        if result.deleted_count == 1:
            return {"message": "Book deleted successfully"}
        raise HTTPException(status_code=404, detail="Book not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid book ID")


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
