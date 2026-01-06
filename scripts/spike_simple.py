"""
SPIKE: Gemini Native PDF Processing
=====================================
Skip pymupdf/chonkie - use Gemini's native PDF vision to extract quotes directly.

This is MUCH simpler:
1. Upload PDF to Gemini Files API
2. Gemini sees entire document (up to 1000 pages with vision)
3. Extract quotes via structured output

Run: uv run --env-file ../.env spike_simple.py
"""

from google import genai
from google.genai import types
import pathlib
import json
import os

# Config
BOOKS_DIR = pathlib.Path.home() / "Downloads" / "Books"
MODEL = "gemini-3-flash-preview"  # Using Gemini 3 Flash for native PDF vision

# Pick a good test book - something with rich prose
TEST_BOOK = "Eric Jorgenson - The Almanack of Naval Ravikant_ A Guide to Wealth and Happiness (2020, Magrathea Publishing) - libgen.li.epub"
# Try PDF first since Gemini handles PDFs better
TEST_PDF = "Concrete Mathematics.pdf"


def main():
    print("\n📚 BOOKFEED SPIKE - Gemini Native PDF Processing\n")
    print("─" * 50)

    # Initialize client with API key from environment
    api_key = os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY")
    if not api_key:
        print("   ❌ Missing GOOGLE_GENERATIVE_AI_API_KEY in environment")
        return

    client = genai.Client(api_key=api_key)

    # Step 1: Upload PDF
    print("\n1️⃣  UPLOADING PDF TO GEMINI FILES API...")
    pdf_path = BOOKS_DIR / TEST_PDF
    print(f"   File: {TEST_PDF}")
    print(f"   Size: {pdf_path.stat().st_size / 1024 / 1024:.1f} MB")

    uploaded_file = client.files.upload(file=pdf_path)
    print(f"   ✓ Uploaded: {uploaded_file.name}")

    # Step 2: Extract quotes using structured output
    print("\n2️⃣  EXTRACTING QUOTES WITH GEMINI...")

    # Define the schema for structured output
    extract_schema = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "quote": {
                    "type": "string",
                    "description": "The verbatim quote from the book (1-3 sentences)"
                },
                "page_hint": {
                    "type": "integer",
                    "description": "Approximate page number"
                },
                "category": {
                    "type": "string",
                    "enum": ["insight", "wisdom", "humor", "technical", "story"],
                    "description": "Category of the quote"
                },
                "context": {
                    "type": "string",
                    "description": "Brief context about where this appears in the book"
                }
            },
            "required": ["quote", "category"]
        }
    }

    prompt = """You are a literary curator extracting the most valuable quotes from this book.

Find 10-15 of the BEST quotes that:
- Stand alone meaningfully (make sense without context)
- Are insightful, surprising, or beautifully written
- Would make someone want to read the book
- Cover different themes/topics from the book

For each quote:
1. Extract it VERBATIM from the text
2. Note the approximate page if visible
3. Categorize it (insight, wisdom, humor, technical, story)
4. Add brief context about where it appears

Skip:
- Technical formulas or equations (unless explained beautifully)
- Lists, tables, or indexes
- Filler text or transitions

Return as JSON array."""

    response = client.models.generate_content(
        model=MODEL,
        contents=[uploaded_file, prompt],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=extract_schema,
        )
    )

    # Parse and display results
    print("\n3️⃣  RESULTS:\n")

    try:
        quotes = json.loads(response.text)
        print(f"   Found {len(quotes)} quotes:\n")

        for i, q in enumerate(quotes, 1):
            print(f"   ┌─ Quote {i} ─────────────────────────────────────")
            print(f"   │ Category: {q.get('category', 'unknown')}")
            if q.get('page_hint'):
                print(f"   │ Page: ~{q['page_hint']}")
            print(f"   │")
            # Wrap quote text
            quote_text = q['quote']
            print(f"   │ \"{quote_text}\"")
            if q.get('context'):
                print(f"   │")
                print(f"   │ 📍 {q['context']}")
            print(f"   └────────────────────────────────────────────────\n")

        # Save to file for review
        output_path = pathlib.Path("quotes_output.json")
        output_path.write_text(json.dumps(quotes, indent=2))
        print(f"\n   ✓ Saved to {output_path}")

    except json.JSONDecodeError as e:
        print(f"   ⚠️  Failed to parse JSON: {e}")
        print(f"   Raw response:\n{response.text[:500]}...")

    print("\n" + "─" * 50)
    print("✅ SPIKE COMPLETE\n")


if __name__ == "__main__":
    main()
