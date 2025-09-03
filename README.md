# MCP Swagger

A modern documentation and testing tool for Model Context Protocol (MCP) servers, inspired by Swagger UI for REST APIs.

## Features

- **Server Connection Management**: Connect to local or remote MCP servers via multiple transport types
- **Interactive Documentation**: Beautiful, modern UI for exploring MCP server capabilities
- **Tools Testing**: Interactive interface for testing MCP tools with parameter validation
- **Resources Browser**: Explore and read server resources
- **Prompts Testing**: Test and validate prompt templates
- **Real-time Playground**: Interactive testing environment for all MCP capabilities

## Project Status

### ✅ Completed

- [x] Next.js application bootstrap with TypeScript and TailwindCSS
- [x] Project structure and core dependencies setup
- [x] MCP connection infrastructure and transport handling
- [x] Server configuration system for remote/local MCP servers
- [x] Main documentation interface with server capabilities overview
- [x] Tools documentation and testing interface
- [x] Modern Swagger-like UI with API documentation styling

### 🚧 In Progress

- [ ] Resources documentation and browser
- [ ] Prompts documentation and testing
- [ ] Interactive testing playground with request/response visualization

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
cd mcp-swagger
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect to a Server**: Use the server selector to choose from preconfigured MCP servers or add your own
2. **Explore Capabilities**: View the overview tab to see what the server supports
3. **Test Tools**: Navigate to the Tools tab to see available functions and test them interactively
4. **Browse Resources**: Explore server resources and their schemas
5. **Try Prompts**: Test prompt templates with different parameters

## Configuration

Server configurations are stored in `src/config/servers.ts`. You can add new servers by modifying this file:

```typescript
{
  "my-server": {
    name: "My Custom Server",
    transport: "sse",
    url: "https://my-server.com/mcp",
    description: "My custom MCP server"
  }
}
```

## Supported Transport Types

- **SSE (Server-Sent Events)**: For remote MCP servers
- **stdio**: For local MCP servers (coming soon)
- **streamable-http**: For HTTP-based MCP servers (coming soon)

## Technology Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS framework
- **Radix UI**: Headless UI components
- **MCP SDK**: Official Model Context Protocol SDK
- **Lucide React**: Modern icon library

## Architecture

The application follows a modular architecture:

- `src/app/`: Next.js app router pages
- `src/components/`: Reusable UI components
- `src/lib/`: Core utilities and hooks
- `src/config/`: Configuration files
- `src/utils/`: Helper utilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Related Projects

- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - Local MCP testing tool
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - TypeScript SDK for MCP
