#!/usr/bin/env python3
"""
Crawl4AI Backend Script
Handles web crawling requests from the Next.js frontend
"""

import asyncio
import json
import sys
import os
import logging
from io import StringIO
from contextlib import redirect_stdout, redirect_stderr
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from crawl4ai.deep_crawl_config import DeepCrawlConfig

# Suppress Crawl4AI logging output to keep JSON clean
os.environ['CRAWL4AI_QUIET'] = '1'

# Configure logging to go to stderr
logging.basicConfig(
    level=logging.ERROR,
    stream=sys.stderr,
    format='%(levelname)s: %(message)s'
)

async def crawl(url, extraction_type="markdown", js_code=None, css_selector=None, llm_prompt=None, headless=True, 
                deep_crawl=False, crawl_strategy="bfs", max_pages=10):
    """
    Main crawl function that processes different extraction strategies
    
    Args:
        url: Target URL to crawl
        extraction_type: Type of extraction (markdown, css, llm)
        js_code: Optional JavaScript code to execute
        css_selector: CSS selector for CSS extraction
        llm_prompt: Prompt for LLM extraction
        headless: Run browser in headless mode
        deep_crawl: Whether to crawl multiple pages (entire site)
        crawl_strategy: Strategy for deep crawling (bfs or dfs)
        max_pages: Maximum number of pages to crawl (limit for safety)
    """
    try:
        # Configure browser - disable verbose logging
        browser_config = BrowserConfig(
            headless=headless,
            verbose=False
        )
        
        # Configure crawler run
        run_config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            word_count_threshold=1
        )
        
        # Add JavaScript code if provided
        if js_code:
            run_config.js_code = [js_code]
        
        # Configure deep crawling if enabled
        deep_config = None
        if deep_crawl:
            deep_config = DeepCrawlConfig(
                max_depth=10,  # Maximum depth to crawl
                max_pages=max_pages,  # Maximum pages limit
                strategy=crawl_strategy,  # "bfs" or "dfs"
                same_domain_only=True  # Stay on same domain
            )
        
        # Redirect stdout/stderr during crawling to suppress Crawl4AI output
        stdout_buffer = StringIO()
        stderr_buffer = StringIO()
        
        # Create crawler and run
        with redirect_stdout(stdout_buffer), redirect_stderr(stderr_buffer):
            async with AsyncWebCrawler(config=browser_config) as crawler:
                if deep_crawl and deep_config:
                    # Deep crawl - returns list of results
                    results = await crawler.arun_many(
                        [url],
                        config=run_config,
                        deep_config=deep_config
                    )
                    result = results  # Keep all results
                else:
                    # Single page crawl
                    result = await crawler.arun(
                        url=url,
                        config=run_config
                    )
        
        # Process result based on extraction type (outside redirect blocks)
        if extraction_type == "markdown":
            # Handle deep crawl results (list of pages)
            if deep_crawl and isinstance(result, list):
                pages = []
                total_words = 0
                
                for page_result in result:
                    content = page_result.markdown
                    word_count = len(content.split()) if content else 0
                    total_words += word_count
                    
                    pages.append({
                        "url": page_result.url,
                        "content": content,
                        "wordCount": word_count,
                        "title": page_result.title if hasattr(page_result, 'title') else ""
                    })
                
                return {
                    "success": True,
                    "deepCrawl": True,
                    "pages": pages,
                    "totalPages": len(pages),
                    "totalWords": total_words,
                    "status": "completed"
                }
            else:
                # Single page result
                content = result.markdown
                word_count = len(content.split()) if content else 0
                
                return {
                    "success": True,
                    "content": content,
                    "wordCount": word_count,
                    "status": "completed"
                }
            
        elif extraction_type == "css":
            # For CSS extraction, return the HTML for now
            # You can implement custom CSS extraction logic here
            content = result.markdown
            
            return {
                "success": True,
                "content": content,
                "status": "completed",
                "note": "CSS extraction - showing markdown. Implement CSS selector logic as needed."
            }
            
        elif extraction_type == "llm":
            # For LLM extraction, you would use LLMExtractionStrategy
            # This is a placeholder showing the structure
            content = result.markdown
            
            return {
                "success": True,
                "content": content,
                "status": "completed",
                "note": "LLM extraction requires API keys. Configure LLMExtractionStrategy."
            }
        
        else:
            return {
                "success": False,
                "error": f"Unknown extraction type: {extraction_type}"
            }
                
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    """
    Main entry point - reads JSON from stdin and returns JSON to stdout
    """
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        params = json.loads(input_data)
        
        # Extract parameters
        url = params.get("url")
        extraction_type = params.get("extractionType", "markdown")
        js_code = params.get("jsCode")
        css_selector = params.get("cssSelector")
        llm_prompt = params.get("llmPrompt")
        headless = params.get("headless", True)
        deep_crawl = params.get("deepCrawl", False)
        crawl_strategy = params.get("crawlStrategy", "bfs")
        max_pages = params.get("maxPages", 10)
        
        # Validate URL
        if not url:
            print(json.dumps({
                "success": False,
                "error": "URL is required"
            }))
            sys.exit(1)
        
        # Run the crawl
        result = asyncio.run(crawl(
            url=url,
            extraction_type=extraction_type,
            js_code=js_code,
            css_selector=css_selector,
            llm_prompt=llm_prompt,
            headless=headless,
            deep_crawl=deep_crawl,
            crawl_strategy=crawl_strategy,
            max_pages=max_pages
        ))
        
        # Output result as JSON
        print(json.dumps(result))
        sys.exit(0)
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Backend error: {str(e)}"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()

