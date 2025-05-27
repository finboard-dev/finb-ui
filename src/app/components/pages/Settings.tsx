"use client";

import { useState, useEffect } from "react";
import { getAllDataSources } from "@/lib/api/datasource";
import { persistor, store } from "@/lib/store/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { disconnectAccount, initAddQuickBookAccount } from "@/lib/api/intuitService";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/api/logout";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { clearUserData } from "@/lib/store/slices/userSlice";
import { setMainContent, setActiveSettingsSection, selectActiveSettingsSection } from "@/lib/store/slices/uiSlice";
import Image from "next/image";
import connectToQuickBooksMed from "@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_transparent_btn_short_default.svg";
import connectToQuickBooksHoverMed from "@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_transparent_btn_short_hover.svg";
import connectToQuickBooksHoverSmall from "@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_short_hover.svg";
import connectToQuickbooksSmall from "@/../public/buttons/Connect_to_QuickBooks_buttons/Connect_to_QuickBooks_English/Connect_to_QuickBooks_SVG/C2QB_green_btn_short_default.svg";
import {toast} from "sonner";

interface DataSource {
    id: string;
    name: string;
    type: string;
    status: string;
    last_refreshed_at: string;
}

const Settings = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("all");
    const [isConnecting, setIsConnecting] = useState(false);
    const activeSection = useAppSelector(selectActiveSettingsSection);

    const user = store.getState().user.selectedCompany;
    const company_id = user?.id;

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const data = await getAllDataSources(company_id);
            setDataSources(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error("Error fetching data sources:", err);
            setError("Failed to load data sources. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (company_id) {
            fetchData();
        } else {
            setIsLoading(false);
            setError("No company selected");
        }
    }, [company_id]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "connected":
                return <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />;
            case "disconnected":
                return <XCircle className="h-4 w-4 mr-1 text-red-600" />;
            case "expired":
                return <Clock className="h-4 w-4 mr-1 text-orange-600" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "connected":
                return "bg-green-100 text-green-800 border-green-300";
            case "disconnected":
                return "bg-red-100 text-red-800 border-red-300";
            case "expired":
                return "bg-orange-100 text-orange-800 border-orange-300";
            default:
                return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

    const handleConnect = async (sourceId: string) => {
        try {
            setIsConnecting(true);
            const redirectUrl = await initAddQuickBookAccount();
            if (redirectUrl) {
                window.open(redirectUrl, "_blank");
            } else {
                console.error("No redirect URL provided");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsConnecting(false);
            await fetchData();
        }
    };

    const handleDisconnect = async (sourceId: string) => {
        try {
            const response = await disconnectAccount(sourceId);
            console.log(response);
            await fetchData();
        } catch (error) {
            console.error("Error disconnecting account:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            dispatch(clearUserData());
            await persistor.purge();
            router.push("/login");
            toast.success("Logged out successfully");
        } catch (e) {
            console.error("Error during logout:", e);
            alert("Error during logout. Please try again.");
        }
    };

    const filteredSources =
        activeTab === "all"
            ? dataSources
            : dataSources.filter((source) => source.status.toLowerCase() === activeTab.toLowerCase());

    const renderDataConnections = () => (
        <Card className="border-gray-200 w-full">
            <div className={"w-full flex justify-between items-center px-6"}>
                 <div>
                     <div className="text-xl font-semibold">Data Source</div>
                     <div className="text-gray-500">Manage your QuickBooks and other data connections</div>
                 </div>
                <button className={""} onClick={() => handleConnect("")} disabled={isConnecting}>
                    <Image
                        src={connectToQuickBooksMed}
                        alt="Connect to QuickBooks"
                        onMouseEnter={(e) => (e.currentTarget.src = connectToQuickBooksHoverMed.src)}
                        onMouseLeave={(e) => (e.currentTarget.src = connectToQuickBooksMed.src)}
                    />
                </button>
            </div>
            <CardContent>
                <div className="flex items-center justify-between mb-7">
                    {/*<Tabs value={activeTab} onValueChange={setActiveTab}>*/}
                    {/*    <TabsList className="flex space-x-2 rounded-md bg-gray-100 p-1">*/}
                    {/*        <TabsTrigger*/}
                    {/*            value="all"*/}
                    {/*            className={`rounded-md px-4 py-1 text-sm ${activeTab === "all" ? "bg-white shadow-sm" : ""}`}*/}
                    {/*        >*/}
                    {/*            All*/}
                    {/*        </TabsTrigger>*/}
                    {/*        <TabsTrigger*/}
                    {/*            value="connected"*/}
                    {/*            className={`rounded-md px-4 py-1 text-sm ${activeTab === "connected" ? "bg-white shadow-sm" : ""}`}*/}
                    {/*        >*/}
                    {/*            Connected*/}
                    {/*        </TabsTrigger>*/}
                    {/*        <TabsTrigger*/}
                    {/*            value="disconnected"*/}
                    {/*            className={`rounded-md px-4 py-1 text-sm ${activeTab === "disconnected" ? "bg-white shadow-sm" : ""}`}*/}
                    {/*        >*/}
                    {/*            Disconnected*/}
                    {/*        </TabsTrigger>*/}
                    {/*        <TabsTrigger*/}
                    {/*            value="expired"*/}
                    {/*            className={`rounded-md px-4 py-1 text-sm ${activeTab === "expired" ? "bg-white shadow-sm" : ""}`}*/}
                    {/*        >*/}
                    {/*            Expired*/}
                    {/*        </TabsTrigger>*/}
                    {/*    </TabsList>*/}
                    {/*</Tabs>*/}
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <span className="text-lg text-gray-600">Loading...</span>
                    </div>
                ) : isConnecting ? (
                    <div className="flex justify-center items-center h-64">
                        <span className="text-lg text-gray-600">Connecting...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-red-600">{error}</p>
                        <Button variant="outline" onClick={fetchData} className="mt-4">
                            Try Again
                        </Button>
                    </div>
                ) : filteredSources.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No data sources found.</p>
                        <button onClick={() => handleConnect("")} disabled={isConnecting} className="mt-4">
                            <Image
                                src={connectToQuickBooksMed || "/placeholder.svg"}
                                alt="Connect to QuickBooks"
                                onMouseEnter={(e) => (e.currentTarget.src = connectToQuickBooksHoverMed.src)}
                                onMouseLeave={(e) => (e.currentTarget.src = connectToQuickBooksMed.src)}
                            />
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-md border border-gray-200">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 text-left text-sm font-medium text-gray-500 border-b border-gray-200">
                                    <TableHead className="px-4 py-3">Name</TableHead>
                                    <TableHead className="px-4 py-3">Source</TableHead>
                                    <TableHead className="px-4 py-3">Status</TableHead>
                                    <TableHead className="px-4 py-3">Last Updated</TableHead>
                                    <TableHead className="px-4 py-3">ID</TableHead>
                                    <TableHead className="px-4 py-3">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSources.map((source) => (
                                    <TableRow key={source.id} className="border-b border-gray-300 text-sm">
                                        <TableCell className="px-4 py-3">{source.name}</TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {source.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">
                                            <Badge variant="outline" className={`flex items-center ${getStatusColor(source.status)}`}>
                                                {getStatusIcon(source.status)}
                                                {source.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-4 py-3">{formatDate(source.last_refreshed_at)}</TableCell>
                                        <TableCell className="px-4 py-3">{source.id.substring(0, 8)}...</TableCell>
                                        <TableCell className="px-4 py-3">
                                            {source.status === "CONNECTED" && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDisconnect(source.id)}
                                                    disabled={isConnecting}
                                                >
                                                    Disconnect
                                                </Button>
                                            )}
                                            {(source.status === "DISCONNECTED" || source.status === "EXPIRED") && (
                                                <button onClick={() => handleConnect(source.id)} disabled={isConnecting}>
                                                    <Image
                                                        src={connectToQuickbooksSmall || "/placeholder.svg"}
                                                        alt={source.status === "EXPIRED" ? "Reconnect to QuickBooks" : "Connect to QuickBooks"}
                                                        onMouseEnter={(e) => {
                                                            const img = e.currentTarget
                                                            img.src = connectToQuickBooksHoverSmall.src
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            const img = e.currentTarget
                                                            img.src = connectToQuickbooksSmall.src
                                                        }}
                                                    />
                                                </button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const renderProfile = () => (
        <Card className="shadow-lg border-gray-200 w-full">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Profile</CardTitle>
                <CardDescription className="text-gray-500">Manage your personal account information</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-gray-600">Your profile settings content goes here.</p>
            </CardContent>
        </Card>
    );

    const renderSecurity = () => (
        <Card className="shadow-lg border-gray-200 w-full">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Security</CardTitle>
                <CardDescription className="text-gray-500">Manage your account security and privacy</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-gray-600">Your security settings content goes here.</p>
            </CardContent>
        </Card>
    );

    const renderLogout = () => (
        <Card className="shadow-lg border-gray-200 w-full">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Logout</CardTitle>
                <CardDescription className="text-gray-500">Sign out of your account</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="destructive" onClick={handleLogout}>
                    Confirm Logout
                </Button>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex-1 mt-12">
            {/* Header */}
            <div className="flex pt-8 items-center pl-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => dispatch(setMainContent("chat"))}
                    className="border border-gray-200 rounded-md p-3 max-h-fit mr-4"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-500" />
                </Button>
                <h1 className="text-2xl font-semibold">Settings</h1>
            </div>

            <div className="flex w-full h-full gap-5 px-6 justify-center">
                {/* Settings Sidebar */}
                <div className="min-w-fit text-wrap flex justify-end pt-14">
                    <nav className="text-base items-start flex flex-col h-[calc(100vh-200px)] justify-between">
                        <div className="space-y-3">
                            <button
                                onClick={() => dispatch(setActiveSettingsSection("data-connections"))}
                                className={`block rounded-md px-3 py-2 font-medium ${
                                    activeSection === "data-connections" ? "bg-gray-100" : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                Data Connections
                            </button>
                            <button
                                onClick={() => dispatch(setActiveSettingsSection("profile"))}
                                className={`block rounded-md px-3 py-2 font-medium ${
                                    activeSection === "profile" ? "bg-gray-100" : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                Profile
                            </button>
                            <button
                                onClick={() => dispatch(setActiveSettingsSection("security"))}
                                className={`block rounded-md px-3 py-2 font-medium ${
                                    activeSection === "security" ? "bg-gray-100" : "text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                Security
                            </button>
                        </div>

                        <Button
                            onClick={handleLogout}
                            variant={"destructive"}
                            className={"cursor-pointer block rounded-md text-gray-700 hover:bg-gray-200 px-3 py-2 bg-gray-100 font-medium  mt-auto"}
                        >
                            Logout
                        </Button>
                    </nav>
                </div>

                {/* Settings Content */}
                <div className="pt-14 min-w-lg:max-w-2xl w-full">
                    {activeSection === "data-connections" && renderDataConnections()}
                    {activeSection === "profile" && renderProfile()}
                    {activeSection === "security" && renderSecurity()}
                    {/*{activeSection === "logout" && renderLogout()}*/}
                </div>
            </div>
        </div>
    );
};

export default Settings;