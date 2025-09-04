import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Key, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { ConnectionState } from "@/lib/types/mcp";

interface OAuthConfig {
    clientId: string;
    scope: string;
    authorizationUrl: string;
    tokenUrl: string;
}

interface AuthToken {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    scope?: string;
}

interface AuthTabProps {
    connectionState: ConnectionState;
}

export function AuthTab({ }: AuthTabProps) {
    const [oauthConfig, setOauthConfig] = useState<OAuthConfig>({
        clientId: "",
        scope: "",
        authorizationUrl: "",
        tokenUrl: "",
    });

    const [authTokens, setAuthTokens] = useState<AuthToken | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // Load stored OAuth config and tokens
    useEffect(() => {
        const storedConfig = localStorage.getItem("mcp-oauth-config");
        const storedTokens = localStorage.getItem("mcp-auth-tokens");

        if (storedConfig) {
            setOauthConfig(JSON.parse(storedConfig));
        }

        if (storedTokens) {
            setAuthTokens(JSON.parse(storedTokens));
        }
    }, []);

    const saveOAuthConfig = (config: OAuthConfig) => {
        setOauthConfig(config);
        localStorage.setItem("mcp-oauth-config", JSON.stringify(config));
    };

    const saveAuthTokens = (tokens: AuthToken) => {
        setAuthTokens(tokens);
        localStorage.setItem("mcp-auth-tokens", JSON.stringify(tokens));
    };

    const handleStartOAuth = async () => {
        if (!oauthConfig.clientId || !oauthConfig.authorizationUrl) {
            setAuthError("Client ID and Authorization URL are required");
            return;
        }

        setIsAuthenticating(true);
        setAuthError(null);

        // Generate PKCE code verifier and challenge
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        // Store code verifier for later
        sessionStorage.setItem("mcp-pkce-verifier", codeVerifier);

        // Build authorization URL
        const authUrl = new URL(oauthConfig.authorizationUrl);
        authUrl.searchParams.set("client_id", oauthConfig.clientId);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", oauthConfig.scope || "");
        authUrl.searchParams.set("redirect_uri", `${window.location.origin}/auth/callback`);
        authUrl.searchParams.set("code_challenge", codeChallenge);
        authUrl.searchParams.set("code_challenge_method", "S256");

        // Open authorization URL
        window.location.href = authUrl.toString();
    };

    const handleRefreshToken = async () => {
        if (!authTokens?.refreshToken || !oauthConfig.tokenUrl) {
            setAuthError("No refresh token available");
            return;
        }

        try {
            const response = await fetch(oauthConfig.tokenUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "refresh_token",
                    refresh_token: authTokens.refreshToken,
                    client_id: oauthConfig.clientId,
                }),
            });

            if (!response.ok) {
                throw new Error(`Token refresh failed: ${response.statusText}`);
            }

            const data = await response.json();
            const newTokens: AuthToken = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || authTokens.refreshToken,
                expiresAt: data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined,
                scope: data.scope,
            };

            saveAuthTokens(newTokens);
            setAuthError(null);
        } catch (error) {
            setAuthError(error instanceof Error ? error.message : "Token refresh failed");
        }
    };

    const handleClearTokens = () => {
        setAuthTokens(null);
        localStorage.removeItem("mcp-auth-tokens");
    };

    const isTokenExpired = () => {
        return authTokens?.expiresAt && Date.now() > authTokens.expiresAt;
    };

    const getTokenStatus = () => {
        if (!authTokens) return "No tokens";
        if (isTokenExpired()) return "Expired";
        return "Active";
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Authentication
                    </CardTitle>
                    <CardDescription>
                        Configure OAuth authentication and manage access tokens for MCP servers
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="oauth" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="oauth">OAuth Configuration</TabsTrigger>
                            <TabsTrigger value="tokens">Token Management</TabsTrigger>
                        </TabsList>

                        <TabsContent value="oauth" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="client-id">Client ID</Label>
                                    <Input
                                        id="client-id"
                                        type="text"
                                        value={oauthConfig.clientId}
                                        onChange={(e) =>
                                            saveOAuthConfig({ ...oauthConfig, clientId: e.target.value })
                                        }
                                        placeholder="your-oauth-client-id"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="scope">Scope</Label>
                                    <Input
                                        id="scope"
                                        type="text"
                                        value={oauthConfig.scope}
                                        onChange={(e) =>
                                            saveOAuthConfig({ ...oauthConfig, scope: e.target.value })
                                        }
                                        placeholder="openid profile email"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="auth-url">Authorization URL</Label>
                                    <Input
                                        id="auth-url"
                                        type="url"
                                        value={oauthConfig.authorizationUrl}
                                        onChange={(e) =>
                                            saveOAuthConfig({ ...oauthConfig, authorizationUrl: e.target.value })
                                        }
                                        placeholder="https://auth.example.com/oauth/authorize"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="token-url">Token URL</Label>
                                    <Input
                                        id="token-url"
                                        type="url"
                                        value={oauthConfig.tokenUrl}
                                        onChange={(e) =>
                                            saveOAuthConfig({ ...oauthConfig, tokenUrl: e.target.value })
                                        }
                                        placeholder="https://auth.example.com/oauth/token"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleStartOAuth}
                                    disabled={!oauthConfig.clientId || !oauthConfig.authorizationUrl || isAuthenticating}
                                    className="flex items-center gap-2"
                                >
                                    {isAuthenticating ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ExternalLink className="w-4 h-4" />
                                    )}
                                    {isAuthenticating ? "Authenticating..." : "Start OAuth Flow"}
                                </Button>
                            </div>

                            {authError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{authError}</AlertDescription>
                                </Alert>
                            )}
                        </TabsContent>

                        <TabsContent value="tokens" className="space-y-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Key className="w-4 h-4" />
                                        <span className="font-medium">Token Status</span>
                                    </div>
                                    <Badge
                                        variant={
                                            getTokenStatus() === "Active"
                                                ? "default"
                                                : getTokenStatus() === "Expired"
                                                    ? "destructive"
                                                    : "secondary"
                                        }
                                    >
                                        {getTokenStatus()}
                                    </Badge>
                                </div>

                                {authTokens && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Access Token</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    type="password"
                                                    value={authTokens.accessToken}
                                                    readOnly
                                                    className="font-mono text-xs"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigator.clipboard.writeText(authTokens.accessToken)}
                                                >
                                                    Copy
                                                </Button>
                                            </div>
                                        </div>

                                        {authTokens.refreshToken && (
                                            <div className="space-y-2">
                                                <Label>Refresh Token</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="password"
                                                        value={authTokens.refreshToken}
                                                        readOnly
                                                        className="font-mono text-xs"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => navigator.clipboard.writeText(authTokens.refreshToken || '')}
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {authTokens.expiresAt && (
                                            <div className="space-y-2">
                                                <Label>Expires At</Label>
                                                <Input
                                                    type="text"
                                                    value={new Date(authTokens.expiresAt).toLocaleString()}
                                                    readOnly
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            {isTokenExpired() && authTokens.refreshToken && (
                                                <Button
                                                    onClick={handleRefreshToken}
                                                    variant="outline"
                                                    className="flex items-center gap-2"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                    Refresh Token
                                                </Button>
                                            )}

                                            <Button
                                                onClick={handleClearTokens}
                                                variant="destructive"
                                                className="flex items-center gap-2"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                Clear Tokens
                                            </Button>
                                        </div>
                                    </>
                                )}

                                {!authTokens && (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            No authentication tokens found. Configure OAuth settings and start the authentication flow.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Authentication Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        {authTokens && !isTokenExpired() ? (
                            <>
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span>Authenticated</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5 text-yellow-500" />
                                <span>Not authenticated</span>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// PKCE helper functions
function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64URLEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const hash = await sha256(verifier);
    return base64URLEncode(hash);
}

async function sha256(message: string): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return new Uint8Array(hash);
}

function base64URLEncode(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}
