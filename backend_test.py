#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for MyReads Book Tracker
Tests all CRUD operations and edge cases for the book management system.
"""

import asyncio
import httpx
import json
from datetime import datetime
from typing import Dict, Any, Optional

# Backend URL from the review request
BASE_URL = "https://bookfolio.preview.emergentagent.com/api"

class BookTrackerTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_results = []
        self.created_book_ids = []  # Track created books for cleanup
        
    async def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    async def test_isbn_search(self, client: httpx.AsyncClient):
        """Test ISBN search functionality"""
        print("=== Testing ISBN Search ===")
        
        # Test with Harry Potter ISBN as specified in review request
        isbn = "9780439708180"
        try:
            response = await client.get(f"{self.base_url}/books/search/{isbn}")
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["title", "author", "totalPages", "isbn"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if missing_fields:
                    await self.log_test(
                        f"ISBN Search - {isbn}",
                        False,
                        f"Missing required fields: {missing_fields}",
                        data
                    )
                else:
                    await self.log_test(
                        f"ISBN Search - {isbn}",
                        True,
                        f"Found: {data.get('title', 'Unknown')} by {data.get('author', 'Unknown')}",
                        data
                    )
            else:
                await self.log_test(
                    f"ISBN Search - {isbn}",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            await self.log_test(
                f"ISBN Search - {isbn}",
                False,
                f"Exception: {str(e)}"
            )

        # Test with invalid ISBN
        try:
            invalid_isbn = "1234567890"
            response = await client.get(f"{self.base_url}/books/search/{invalid_isbn}")
            
            if response.status_code == 404:
                await self.log_test(
                    "ISBN Search - Invalid ISBN",
                    True,
                    "Correctly returned 404 for invalid ISBN"
                )
            else:
                await self.log_test(
                    "ISBN Search - Invalid ISBN",
                    False,
                    f"Expected 404, got {response.status_code}",
                    response.text
                )
        except Exception as e:
            await self.log_test(
                "ISBN Search - Invalid ISBN",
                False,
                f"Exception: {str(e)}"
            )

    async def test_add_book(self, client: httpx.AsyncClient) -> Optional[str]:
        """Test adding a new book"""
        print("=== Testing Add Book ===")
        
        book_data = {
            "isbn": "9780439708180",
            "title": "Harry Potter and the Sorcerer's Stone",
            "author": "J.K. Rowling",
            "totalPages": 309,
            "currentPage": 0,
            "status": "want_to_read"
        }
        
        try:
            response = await client.post(
                f"{self.base_url}/books",
                json=book_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data:
                    book_id = data["id"]
                    self.created_book_ids.append(book_id)
                    await self.log_test(
                        "Add Book",
                        True,
                        f"Book added successfully with ID: {book_id}",
                        data
                    )
                    return book_id
                else:
                    await self.log_test(
                        "Add Book",
                        False,
                        "Response missing 'id' field",
                        data
                    )
            else:
                await self.log_test(
                    "Add Book",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            await self.log_test(
                "Add Book",
                False,
                f"Exception: {str(e)}"
            )
        
        return None

    async def test_get_all_books(self, client: httpx.AsyncClient):
        """Test getting all books"""
        print("=== Testing Get All Books ===")
        
        try:
            response = await client.get(f"{self.base_url}/books")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    await self.log_test(
                        "Get All Books",
                        True,
                        f"Retrieved {len(data)} books",
                        f"Count: {len(data)}"
                    )
                else:
                    await self.log_test(
                        "Get All Books",
                        False,
                        "Response is not a list",
                        data
                    )
            else:
                await self.log_test(
                    "Get All Books",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            await self.log_test(
                "Get All Books",
                False,
                f"Exception: {str(e)}"
            )

    async def test_get_single_book(self, client: httpx.AsyncClient, book_id: str):
        """Test getting a single book by ID"""
        print("=== Testing Get Single Book ===")
        
        try:
            response = await client.get(f"{self.base_url}/books/{book_id}")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "title", "author", "isbn", "totalPages", "currentPage", "status", "progress"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    await self.log_test(
                        "Get Single Book",
                        False,
                        f"Missing required fields: {missing_fields}",
                        data
                    )
                else:
                    await self.log_test(
                        "Get Single Book",
                        True,
                        f"Retrieved book: {data.get('title', 'Unknown')}",
                        data
                    )
            else:
                await self.log_test(
                    "Get Single Book",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            await self.log_test(
                "Get Single Book",
                False,
                f"Exception: {str(e)}"
            )

        # Test with invalid book ID
        try:
            invalid_id = "invalid_book_id_123"
            response = await client.get(f"{self.base_url}/books/{invalid_id}")
            
            if response.status_code == 400:
                await self.log_test(
                    "Get Single Book - Invalid ID",
                    True,
                    "Correctly returned 400 for invalid book ID"
                )
            else:
                await self.log_test(
                    "Get Single Book - Invalid ID",
                    False,
                    f"Expected 400, got {response.status_code}",
                    response.text
                )
        except Exception as e:
            await self.log_test(
                "Get Single Book - Invalid ID",
                False,
                f"Exception: {str(e)}"
            )

    async def test_get_books_by_status(self, client: httpx.AsyncClient):
        """Test getting books by status"""
        print("=== Testing Get Books by Status ===")
        
        statuses = ["want_to_read", "currently_reading", "read"]
        
        for status in statuses:
            try:
                response = await client.get(f"{self.base_url}/books/status/{status}")
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        await self.log_test(
                            f"Get Books by Status - {status}",
                            True,
                            f"Retrieved {len(data)} books with status '{status}'",
                            f"Count: {len(data)}"
                        )
                    else:
                        await self.log_test(
                            f"Get Books by Status - {status}",
                            False,
                            "Response is not a list",
                            data
                        )
                else:
                    await self.log_test(
                        f"Get Books by Status - {status}",
                        False,
                        f"HTTP {response.status_code}: {response.text}",
                        response.text
                    )
            except Exception as e:
                await self.log_test(
                    f"Get Books by Status - {status}",
                    False,
                    f"Exception: {str(e)}"
                )

    async def test_update_book_progress(self, client: httpx.AsyncClient, book_id: str):
        """Test updating book progress"""
        print("=== Testing Update Book Progress ===")
        
        # Test updating current page
        update_data = {"currentPage": 50}
        
        try:
            response = await client.put(
                f"{self.base_url}/books/{book_id}",
                json=update_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("currentPage") == 50:
                    # Check if progress was calculated correctly
                    expected_progress = (50 / data.get("totalPages", 1)) * 100
                    actual_progress = data.get("progress", 0)
                    
                    if abs(actual_progress - expected_progress) < 0.1:  # Allow small floating point differences
                        await self.log_test(
                            "Update Book Progress",
                            True,
                            f"Progress updated correctly: {actual_progress:.1f}%",
                            data
                        )
                    else:
                        await self.log_test(
                            "Update Book Progress",
                            False,
                            f"Progress calculation incorrect. Expected: {expected_progress:.1f}%, Got: {actual_progress:.1f}%",
                            data
                        )
                else:
                    await self.log_test(
                        "Update Book Progress",
                        False,
                        f"Current page not updated correctly. Expected: 50, Got: {data.get('currentPage')}",
                        data
                    )
            else:
                await self.log_test(
                    "Update Book Progress",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            await self.log_test(
                "Update Book Progress",
                False,
                f"Exception: {str(e)}"
            )

    async def test_update_book_status(self, client: httpx.AsyncClient, book_id: str):
        """Test updating book status"""
        print("=== Testing Update Book Status ===")
        
        # Test changing status to currently_reading
        update_data = {"status": "currently_reading"}
        
        try:
            response = await client.put(
                f"{self.base_url}/books/{book_id}",
                json=update_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "currently_reading":
                    await self.log_test(
                        "Update Book Status - Currently Reading",
                        True,
                        "Status updated to 'currently_reading'",
                        data
                    )
                else:
                    await self.log_test(
                        "Update Book Status - Currently Reading",
                        False,
                        f"Status not updated correctly. Expected: 'currently_reading', Got: {data.get('status')}",
                        data
                    )
            else:
                await self.log_test(
                    "Update Book Status - Currently Reading",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            await self.log_test(
                "Update Book Status - Currently Reading",
                False,
                f"Exception: {str(e)}"
            )

    async def test_mark_book_finished(self, client: httpx.AsyncClient, book_id: str):
        """Test marking a book as finished"""
        print("=== Testing Mark Book as Finished ===")
        
        update_data = {"status": "read"}
        
        try:
            response = await client.put(
                f"{self.base_url}/books/{book_id}",
                json=update_data
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if status is 'read'
                status_correct = data.get("status") == "read"
                
                # Check if progress is 100%
                progress_correct = data.get("progress") == 100
                
                # Check if currentPage equals totalPages
                current_page = data.get("currentPage", 0)
                total_pages = data.get("totalPages", 0)
                pages_correct = current_page == total_pages
                
                # Check if dateFinished is set
                date_finished_set = data.get("dateFinished") is not None
                
                if status_correct and progress_correct and pages_correct and date_finished_set:
                    await self.log_test(
                        "Mark Book as Finished",
                        True,
                        f"Book marked as finished correctly. Progress: {data.get('progress')}%, Pages: {current_page}/{total_pages}",
                        data
                    )
                else:
                    issues = []
                    if not status_correct:
                        issues.append(f"Status: {data.get('status')} (expected 'read')")
                    if not progress_correct:
                        issues.append(f"Progress: {data.get('progress')}% (expected 100%)")
                    if not pages_correct:
                        issues.append(f"Pages: {current_page}/{total_pages} (should be equal)")
                    if not date_finished_set:
                        issues.append("dateFinished not set")
                    
                    await self.log_test(
                        "Mark Book as Finished",
                        False,
                        f"Issues found: {', '.join(issues)}",
                        data
                    )
            else:
                await self.log_test(
                    "Mark Book as Finished",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            await self.log_test(
                "Mark Book as Finished",
                False,
                f"Exception: {str(e)}"
            )

    async def test_delete_book(self, client: httpx.AsyncClient, book_id: str):
        """Test deleting a book"""
        print("=== Testing Delete Book ===")
        
        try:
            response = await client.delete(f"{self.base_url}/books/{book_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    await self.log_test(
                        "Delete Book",
                        True,
                        f"Book deleted successfully: {data.get('message')}",
                        data
                    )
                    
                    # Remove from our tracking list
                    if book_id in self.created_book_ids:
                        self.created_book_ids.remove(book_id)
                        
                    # Verify book is actually deleted
                    verify_response = await client.get(f"{self.base_url}/books/{book_id}")
                    if verify_response.status_code == 404:
                        await self.log_test(
                            "Delete Book - Verification",
                            True,
                            "Book successfully removed from database"
                        )
                    else:
                        await self.log_test(
                            "Delete Book - Verification",
                            False,
                            f"Book still exists after deletion. Status: {verify_response.status_code}",
                            verify_response.text
                        )
                else:
                    await self.log_test(
                        "Delete Book",
                        False,
                        "Response missing 'message' field",
                        data
                    )
            else:
                await self.log_test(
                    "Delete Book",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response.text
                )
        except Exception as e:
            await self.log_test(
                "Delete Book",
                False,
                f"Exception: {str(e)}"
            )

    async def cleanup_created_books(self, client: httpx.AsyncClient):
        """Clean up any books created during testing"""
        print("=== Cleaning Up Test Data ===")
        
        for book_id in self.created_book_ids[:]:  # Copy list to avoid modification during iteration
            try:
                response = await client.delete(f"{self.base_url}/books/{book_id}")
                if response.status_code == 200:
                    print(f"✅ Cleaned up book ID: {book_id}")
                    self.created_book_ids.remove(book_id)
                else:
                    print(f"⚠️  Failed to clean up book ID: {book_id} - Status: {response.status_code}")
            except Exception as e:
                print(f"⚠️  Error cleaning up book ID: {book_id} - {str(e)}")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if "✅ PASS" in result["status"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\nFAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n" + "="*60)

    async def run_all_tests(self):
        """Run all backend API tests"""
        print("Starting MyReads Book Tracker Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print("="*60)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # Test ISBN search first
                await self.test_isbn_search(client)
                
                # Test adding a book
                book_id = await self.test_add_book(client)
                
                # Test getting all books
                await self.test_get_all_books(client)
                
                # If we successfully created a book, test other operations
                if book_id:
                    await self.test_get_single_book(client, book_id)
                    await self.test_get_books_by_status(client)
                    await self.test_update_book_progress(client, book_id)
                    await self.test_update_book_status(client, book_id)
                    await self.test_mark_book_finished(client, book_id)
                    await self.test_delete_book(client, book_id)
                else:
                    print("⚠️  Skipping dependent tests due to book creation failure")
                
                # Clean up any remaining test data
                await self.cleanup_created_books(client)
                
            except Exception as e:
                print(f"❌ Critical error during testing: {str(e)}")
                await self.log_test(
                    "Critical Error",
                    False,
                    f"Unexpected error: {str(e)}"
                )
            
            finally:
                self.print_summary()

async def main():
    """Main test runner"""
    tester = BookTrackerTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())