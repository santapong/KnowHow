"""Run the KnowHow MCP server.

Usage:
    python -m knowhow.mcp              # stdio (default, for Claude Desktop / Claude Code)
    python -m knowhow.mcp --sse        # SSE transport
    python -m knowhow.mcp --http       # Streamable HTTP transport
"""

from __future__ import annotations

import argparse
import sys

# Load .env if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def main() -> None:
    parser = argparse.ArgumentParser(description="KnowHow MCP Server")
    transport = parser.add_mutually_exclusive_group()
    transport.add_argument("--stdio", action="store_true", default=True,
                           help="Use stdio transport (default)")
    transport.add_argument("--sse", action="store_true",
                           help="Use SSE transport")
    transport.add_argument("--http", action="store_true",
                           help="Use Streamable HTTP transport")
    parser.add_argument("--port", type=int, default=8000,
                        help="Port for SSE/HTTP transport (default: 8000)")
    args = parser.parse_args()

    from knowhow.mcp.server import mcp

    if args.sse:
        mcp.run(transport="sse")
    elif args.http:
        mcp.run(transport="streamable-http")
    else:
        mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
