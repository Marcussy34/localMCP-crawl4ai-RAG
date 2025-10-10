#!/usr/bin/env python3
"""
Automated documentation crawler using Crawl4AI backend
"""
import json
import sys
import asyncio
from pathlib import Path
from datetime import datetime, timezone

# Add parent directory to path to import crawl_backend
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from crawl_backend import crawl

async def crawl_docs(url: str, max_pages: int = 0, output_file: str = "docs.json", headless: bool = False):
    """
    Crawl documentation and save to JSON
    
    Args:
        url: Documentation URL to crawl
        max_pages: Maximum pages to crawl (0 = unlimited)
        output_file: Output filename in data/raw/
        headless: Run browser in headless mode (False helps bypass bot detection)
    """
    
    print(f"🚀 Starting crawl of: {url}")
    print(f"   Max pages: {'unlimited' if max_pages == 0 else max_pages}")
    print(f"   Strategy: BFS (breadth-first)")
    print(f"   Extraction: Markdown")
    print(f"   Headless: {headless}")
    print(f"   Note: Non-headless mode may help bypass bot protection")
    print()
    
    try:
        # Add JS code to wait for Netlify verification to complete
        wait_js = """
        // Wait for Netlify verification to complete
        await new Promise(resolve => setTimeout(resolve, 3000));
        """
        
        # Run the crawler with settings to bypass bot detection
        result = await crawl(
            url=url,
            extraction_type="markdown",
            js_code=wait_js,  # Wait 3 seconds for Netlify verification
            headless=headless,  # Non-headless can help bypass Netlify protection
            deep_crawl=True,
            crawl_strategy="bfs",
            max_pages=max_pages,
            stream_progress=False
        )
        
        # Add metadata
        crawl_result = {
            "source": url,
            "crawled_at": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            "total_pages": len(result.get("pages", [])),
            "total_words": sum(page.get("wordCount", 0) for page in result.get("pages", [])),
            "pages": result.get("pages", [])
        }
        
        # Save to file
        output_path = Path(__file__).parent.parent / "data" / "raw" / output_file
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(crawl_result, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Crawled {crawl_result['total_pages']} pages")
        print(f"✅ Total words: {crawl_result['total_words']:,}")
        print(f"✅ Saved to: {output_path}")
        print()
        
        # Show first few pages
        print("📄 Crawled pages:")
        for i, page in enumerate(crawl_result['pages'][:5], 1):
            print(f"   {i}. {page.get('title', 'Untitled')} ({page.get('wordCount', 0)} words)")
        
        if len(crawl_result['pages']) > 5:
            print(f"   ... and {len(crawl_result['pages']) - 5} more pages")
        
        return crawl_result
        
    except Exception as e:
        print(f"❌ Error during crawl: {str(e)}", file=sys.stderr)
        raise

async def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Crawl documentation for MCP indexing')
    parser.add_argument('url', help='Documentation URL to crawl')
    parser.add_argument('-m', '--max-pages', type=int, default=0, 
                       help='Maximum pages to crawl (0 = unlimited)')
    parser.add_argument('-o', '--output', default='docs.json',
                       help='Output filename (saved in data/raw/)')
    parser.add_argument('--headless', action='store_true',
                       help='Run browser in headless mode (default: False for better bot bypass)')
    
    args = parser.parse_args()
    
    await crawl_docs(
        url=args.url,
        max_pages=args.max_pages,
        output_file=args.output,
        headless=args.headless
    )

if __name__ == "__main__":
    asyncio.run(main())

