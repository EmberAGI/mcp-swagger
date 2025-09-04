"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const code = searchParams.get("code");
                const error = searchParams.get("error");
                const errorDescription = searchParams.get("error_description");

                if (error) {
                    setStatus("error");
                    setMessage(errorDescription || error);
                    return;
                }

                if (!code) {
                    setStatus("error");
                    setMessage("No authorization code received");
                    return;
                }

                // Get stored OAuth config
                const oauthConfig = JSON.parse(localStorage.getItem("mcp-oauth-config") || "{}");
                const codeVerifier = sessionStorage.getItem("mcp-pkce-verifier");

                if (!oauthConfig.tokenUrl || !oauthConfig.clientId) {
                    setStatus("error");
                    setMessage("OAuth configuration missing");
                    return;
                }

                if (!codeVerifier) {
                    setStatus("error");
                    setMessage("Code verifier missing");
                    return;
                }

                // Exchange code for tokens
                const tokenResponse = await fetch(oauthConfig.tokenUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        grant_type: "authorization_code",
                        code,
                        redirect_uri: `${window.location.origin}/auth/callback`,
                        client_id: oauthConfig.clientId,
                        code_verifier: codeVerifier,
                    }),
                });

                if (!tokenResponse.ok) {
                    const errorData = await tokenResponse.text();
                    throw new Error(`Token exchange failed: ${errorData}`);
                }

                const tokenData = await tokenResponse.json();

                // Store tokens
                const authTokens = {
                    accessToken: tokenData.access_token,
                    refreshToken: tokenData.refresh_token,
                    expiresAt: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : undefined,
                    scope: tokenData.scope,
                };

                localStorage.setItem("mcp-auth-tokens", JSON.stringify(authTokens));

                // Clear code verifier
                sessionStorage.removeItem("mcp-pkce-verifier");

                setStatus("success");
                setMessage("Authentication successful! Redirecting...");

                // Redirect back to main app after a short delay
                setTimeout(() => {
                    router.push("/");
                }, 2000);

            } catch (error) {
                console.error("Auth callback error:", error);
                setStatus("error");
                setMessage(error instanceof Error ? error.message : "Authentication failed");
            }
        };

        handleCallback();
    }, [searchParams, router]);

    const handleGoBack = () => {
        router.push("/");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2">
                        {status === "loading" && <Loader2 className="w-5 h-5 animate-spin" />}
                        {status === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {status === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
                        OAuth Callback
                    </CardTitle>
                    <CardDescription>
                        {status === "loading" && "Processing authentication..."}
                        {status === "success" && "Authentication completed successfully"}
                        {status === "error" && "Authentication failed"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-gray-600">
                        {message}
                    </p>

                    {status === "error" && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {message}
                            </AlertDescription>
                        </Alert>
                    )}

                    {status !== "loading" && (
                        <Button onClick={handleGoBack} className="w-full">
                            Return to Application
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function AuthCallback() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            OAuth Callback
                        </CardTitle>
                        <CardDescription>
                            Processing authentication...
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
