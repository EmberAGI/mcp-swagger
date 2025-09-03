"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, Trash2, Save, Download, Upload } from "lucide-react";
import { MCPServer, MCPServerConfig } from "@/lib/types/mcp";
import { loadServerConfig, saveServerConfig, defaultServerConfig } from "@/config/servers";

interface ConfigTabProps {
    onConfigUpdate?: (config: MCPServerConfig) => void;
}

export function ConfigTab({ onConfigUpdate }: ConfigTabProps) {
    const [config, setConfig] = useState<MCPServerConfig>(defaultServerConfig);
    const [newServerName, setNewServerName] = useState("");
    const [editingServer, setEditingServer] = useState<string | null>(null);
    const [serverForm, setServerForm] = useState<MCPServer>({
        name: "",
        transport: "sse",
        url: "",
        command: "",
        args: [],
        env: {},
        description: ""
    });
    const [importData, setImportData] = useState("");

    useEffect(() => {
        const loadedConfig = loadServerConfig();
        setConfig(loadedConfig);
    }, []);

    const handleSaveConfig = () => {
        saveServerConfig(config);
        onConfigUpdate?.(config);
    };

    const handleAddServer = () => {
        if (!newServerName || config.servers[newServerName]) return;

        const newServer: MCPServer = {
            name: newServerName,
            transport: "sse",
            url: "",
            description: ""
        };

        setConfig(prev => ({
            ...prev,
            servers: {
                ...prev.servers,
                [newServerName]: newServer
            }
        }));

        setNewServerName("");
        setEditingServer(newServerName);
        setServerForm(newServer);
    };

    const handleEditServer = (serverId: string) => {
        const server = config.servers[serverId];
        setEditingServer(serverId);
        setServerForm({ ...server });
    };

    const handleSaveServer = () => {
        if (!editingServer) return;

        setConfig(prev => ({
            ...prev,
            servers: {
                ...prev.servers,
                [editingServer]: { ...serverForm }
            }
        }));

        setEditingServer(null);
    };

    const handleDeleteServer = (serverId: string) => {
        setConfig(prev => {
            const newServers = { ...prev.servers };
            delete newServers[serverId];
            return {
                ...prev,
                servers: newServers,
                defaultServer: prev.defaultServer === serverId ? Object.keys(newServers)[0] : prev.defaultServer
            };
        });
    };

    const handleExportConfig = () => {
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mcp-swagger-config.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImportConfig = () => {
        try {
            const imported = JSON.parse(importData);
            setConfig(imported);
            setImportData("");
        } catch (error) {
            console.error("Failed to import config:", error);
        }
    };

    const updateServerFormField = (field: string, value: any) => {
        setServerForm(prev => ({ ...prev, [field]: value }));
    };

    const addArg = () => {
        setServerForm(prev => ({
            ...prev,
            args: [...(prev.args || []), ""]
        }));
    };

    const updateArg = (index: number, value: string) => {
        setServerForm(prev => ({
            ...prev,
            args: prev.args?.map((arg, i) => i === index ? value : arg) || []
        }));
    };

    const removeArg = (index: number) => {
        setServerForm(prev => ({
            ...prev,
            args: prev.args?.filter((_, i) => i !== index) || []
        }));
    };

    const addEnvVar = (key: string, value: string) => {
        if (!key) return;
        setServerForm(prev => ({
            ...prev,
            env: { ...prev.env, [key]: value }
        }));
    };

    const removeEnvVar = (key: string) => {
        setServerForm(prev => {
            const newEnv = { ...prev.env };
            delete newEnv[key];
            return { ...prev, env: newEnv };
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Configuration</h3>
                <p className="text-sm text-muted-foreground">
                    Manage MCP server configurations and application settings
                </p>
            </div>

            <Tabs defaultValue="servers" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="servers">
                        <Settings className="w-4 h-4 mr-2" />
                        Servers
                    </TabsTrigger>
                    <TabsTrigger value="import-export">
                        <Download className="w-4 h-4 mr-2" />
                        Import/Export
                    </TabsTrigger>
                    <TabsTrigger value="about">
                        About
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="servers" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Add New Server</CardTitle>
                                    <CardDescription>Configure a new MCP server connection</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Server name..."
                                            value={newServerName}
                                            onChange={(e) => setNewServerName(e.target.value)}
                                        />
                                        <Button onClick={handleAddServer} disabled={!newServerName}>
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Existing Servers</CardTitle>
                                    <CardDescription>Manage your configured MCP servers</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {Object.entries(config.servers).map(([id, server]) => (
                                        <div key={id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium">{server.name}</h4>
                                                    <Badge variant="outline">{server.transport}</Badge>
                                                    {config.defaultServer === id && (
                                                        <Badge variant="success">Default</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {server.description || server.url || server.command}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditServer(id)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setConfig(prev => ({ ...prev, defaultServer: id }))}
                                                    disabled={config.defaultServer === id}
                                                >
                                                    Set Default
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteServer(id)}
                                                    disabled={Object.keys(config.servers).length === 1}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        <div>
                            {editingServer && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Edit Server: {editingServer}</CardTitle>
                                        <CardDescription>Configure server connection details</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="server-name">Name</Label>
                                            <Input
                                                id="server-name"
                                                value={serverForm.name}
                                                onChange={(e) => updateServerFormField("name", e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="server-transport">Transport</Label>
                                            <Select
                                                value={serverForm.transport}
                                                onValueChange={(value) => updateServerFormField("transport", value)}
                                            >
                                                <SelectTrigger id="server-transport">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sse">SSE (Server-Sent Events)</SelectItem>
                                                    <SelectItem value="stdio">stdio (Local Process)</SelectItem>
                                                    <SelectItem value="streamable-http">Streamable HTTP</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {serverForm.transport === "sse" && (
                                            <div>
                                                <Label htmlFor="server-url">URL</Label>
                                                <Input
                                                    id="server-url"
                                                    placeholder="https://example.com/mcp"
                                                    value={serverForm.url || ""}
                                                    onChange={(e) => updateServerFormField("url", e.target.value)}
                                                />
                                            </div>
                                        )}

                                        {serverForm.transport === "stdio" && (
                                            <>
                                                <div>
                                                    <Label htmlFor="server-command">Command</Label>
                                                    <Input
                                                        id="server-command"
                                                        placeholder="node"
                                                        value={serverForm.command || ""}
                                                        onChange={(e) => updateServerFormField("command", e.target.value)}
                                                    />
                                                </div>

                                                <div>
                                                    <Label>Arguments</Label>
                                                    <div className="space-y-2">
                                                        {serverForm.args?.map((arg, index) => (
                                                            <div key={index} className="flex gap-2">
                                                                <Input
                                                                    value={arg}
                                                                    onChange={(e) => updateArg(index, e.target.value)}
                                                                    placeholder={`Argument ${index + 1}`}
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => removeArg(index)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <Button size="sm" variant="outline" onClick={addArg}>
                                                            <Plus className="w-4 h-4 mr-2" />
                                                            Add Argument
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div>
                                            <Label htmlFor="server-description">Description</Label>
                                            <Textarea
                                                id="server-description"
                                                placeholder="Server description..."
                                                value={serverForm.description || ""}
                                                onChange={(e) => updateServerFormField("description", e.target.value)}
                                            />
                                        </div>

                                        <div className="flex gap-2 pt-4">
                                            <Button onClick={handleSaveServer}>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Server
                                            </Button>
                                            <Button variant="outline" onClick={() => setEditingServer(null)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSaveConfig}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Configuration
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="import-export" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Export Configuration</CardTitle>
                                <CardDescription>Download your current server configuration</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={handleExportConfig} className="w-full">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Config
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Import Configuration</CardTitle>
                                <CardDescription>Load server configuration from JSON</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    placeholder="Paste configuration JSON here..."
                                    value={importData}
                                    onChange={(e) => setImportData(e.target.value)}
                                    rows={8}
                                />
                                <Button
                                    onClick={handleImportConfig}
                                    disabled={!importData}
                                    className="w-full"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Import Config
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="about" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>About MCP Swagger</CardTitle>
                            <CardDescription>Documentation and testing tool for Model Context Protocol servers</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium mb-2">Version</h4>
                                    <p className="text-sm text-muted-foreground">1.0.0</p>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">Built with</h4>
                                    <div className="flex flex-wrap gap-1">
                                        <Badge variant="outline">Next.js</Badge>
                                        <Badge variant="outline">TypeScript</Badge>
                                        <Badge variant="outline">TailwindCSS</Badge>
                                        <Badge variant="outline">MCP SDK</Badge>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-2">Features</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Interactive MCP server documentation</li>
                                    <li>• Real-time tool testing and execution</li>
                                    <li>• Resource browsing and content viewing</li>
                                    <li>• Prompt template testing</li>
                                    <li>• Custom request playground</li>
                                    <li>• Server configuration management</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

