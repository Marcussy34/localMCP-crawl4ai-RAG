#!/usr/bin/env python3
"""
Crawl4AI Backend Script
Handles web crawling requests from the Next.js frontend
"""

import asyncio
import json
import sys
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

async def crawl(url, extraction_type="markdown", js_code=None, css_selector=None, llm_prompt=None, headless=True):
    """
    Main crawl function that processes different extraction strategies
    
    Args:
        url: Target URL to crawl
        extraction_type: Type of extraction (markdown, css, llm)
        js_code: Optional JavaScript code to execute
        css_selector: CSS selector for CSS extraction
        llm_prompt: Prompt for LLM extraction
        headless: Run browser in headless mode
    """
    try:
        # Configure browser
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
        
        # Create crawler and run
        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(
                url=url,
                config=run_config
            )
            
            # Process result based on extraction type
            if extraction_type == "markdown":
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
            headless=headless
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

