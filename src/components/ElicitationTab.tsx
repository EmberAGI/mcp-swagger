import { Alert, AlertDescription } from "@/components/ui/alert";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ElicitationRequest from "./ElicitationRequest";

export interface ElicitationRequestData {
    id: number;
    message: string;
    requestedSchema: Record<string, unknown>;
}

export interface ElicitationResponse {
    action: "accept" | "decline" | "cancel";
    content?: Record<string, unknown>;
}

export type PendingElicitationRequest = {
    id: number;
    request: ElicitationRequestData;
    originatingTab?: string;
};

export type Props = {
    pendingRequests: PendingElicitationRequest[];
    onResolve: (id: number, response: ElicitationResponse) => void;
    onShowModal?: (elicitation: PendingElicitationRequest) => void;
};

const ElicitationTab = ({ pendingRequests, onResolve, onShowModal }: Props) => {
    return (
        <TabsContent value="elicitations">
            <div className="h-96">
                <Alert>
                    <AlertDescription>
                        When the server requests information from the user, requests will
                        appear here for response.
                    </AlertDescription>
                </Alert>
                <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Recent Requests</h3>
                        {pendingRequests.length > 0 && onShowModal && (
                            <Button
                                onClick={() => onShowModal(pendingRequests[0])}
                                variant="outline"
                                size="sm"
                            >
                                Show Modal
                            </Button>
                        )}
                    </div>
                    {pendingRequests.map((request) => (
                        <ElicitationRequest
                            key={request.id}
                            request={request}
                            onResolve={onResolve}
                        />
                    ))}
                    {pendingRequests.length === 0 && (
                        <p className="text-gray-500">No pending requests</p>
                    )}
                </div>
            </div>
        </TabsContent>
    );
};

export default ElicitationTab;
