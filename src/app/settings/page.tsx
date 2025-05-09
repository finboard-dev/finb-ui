"use client"

import { useState, useEffect } from "react"
import { getAllDataSources } from "@/lib/api/datasource"
import {persistor, store} from "@/lib/store/store"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Loader2, RefreshCw, Database, AlertCircle, CheckCircle2, XCircle,
    Clock, Trash2, ArrowLeft, Settings, LogOut, User, ShieldCheck,
    ChevronLeft, ChevronRight, Menu, Sliders, Building
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { disconnectAccount, initAddQuickBookAccount } from "@/lib/api/intuitService"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {logout} from "@/lib/api/logout";
import {useAppDispatch} from "@/lib/store/hooks";
import {clearUserData} from "@/lib/store/slices/userSlice";
import { getConfigurationTemplate } from "@/lib/api/configService"

interface DataSource {
    id: string
    name: string
    type: string
    status: string
    last_refreshed_at: string
}

interface SidebarItem {
    id: string
    label: string
    icon: React.ReactNode
    content: React.ReactNode
}

interface ConfigItem {
    key: string;
    name: string;
    type: string;
    defaultValue?: any;
    options?: string[];
}

interface ConfigSection {
    organizationConfig: ConfigItem[];
    companyConfig: ConfigItem[];
}

export default function SettingsPage() {
    const dispatch = useAppDispatch()
    const [dataSources, setDataSources] = useState<DataSource[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState("all")
    const [activeSidebarItem, setActiveSidebarItem] = useState("data-connections")
    const [sidebarExpanded, setSidebarExpanded] = useState(true)
    const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
    const router = useRouter()
    const [configData, setConfigData] = useState<ConfigSection | null>(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [configError, setConfigError] = useState<string | null>(null);

    const user = store?.getState()?.user?.selectedCompany
    const company_id = user?.id

    const fetchData = async () => {
        try {
            setIsLoading(true)
            const data = await getAllDataSources(company_id)
            setDataSources(Array.isArray(data) ? data : [])
            setError(null)
        } catch (err) {
            console.error("Error fetching data sources:", err)
            setError("Failed to load data sources. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (company_id) {
            fetchData()
        } else {
            setIsLoading(false)
            setError("No company selected")
        }
    }, [company_id])

    const refreshData = async () => {
        setIsRefreshing(true)
        await fetchData()
        setIsRefreshing(false)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "connected":
                return <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" />
            case "disconnected":
                return <XCircle className="h-4 w-4 mr-1 text-red-600" />
            case "expired":
                return <Clock className="h-4 w-4 mr-1 text-orange-600" />
            case "deleted":
                return <Trash2 className="h-4 w-4 mr-1 text-gray-600" />
            default:
                return <AlertCircle className="h-4 w-4 mr-1 text-gray-600" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "connected":
                return "bg-green-100 text-green-800 border-green-300"
            case "disconnected":
                return "bg-red-100 text-red-800 border-red-300"
            case "expired":
                return "bg-orange-100 text-orange-800 border-orange-300"
            case "deleted":
                return "bg-gray-100 text-gray-800 border-gray-300"
            default:
                return "bg-gray-100 text-gray-800 border-gray-300"
        }
    }

    const handleConnect = async (sourceId: string) => {
        try {
            const redirectUrl = await initAddQuickBookAccount()
            if (redirectUrl) {
                window.open(redirectUrl, "_blank")
            } else {
                console.error("No redirect URL provided")
            }
        } catch (error) {
            console.error(error)
        } finally {
            await fetchData()
        }
    }

    const handleDisconnect = async (sourceId: string) => {
        try {
            const response = await disconnectAccount(sourceId)
            console.log(response)
            await fetchData()
        } catch (error) {
            console.error("Error disconnecting account:", error)
        }
    }

    const handleLogout = async () => {
        try {
            console.log("Logging out...")
            await logout();
            dispatch(clearUserData())
            await persistor.purge()
            router.push('/')
        } catch (e) {
            console.error("Error during logout:", e)
            alert("Error during logout. Please try again.")
        }
    }

    const filteredSources =
        activeTab === "all"
            ? dataSources
            : dataSources.filter((source) => source.status.toLowerCase() === activeTab.toLowerCase())

    const renderDataConnectionsContent = () => (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="bg-blue-500 p-3 rounded-full">
                                <Database className="h-6 w-6 text-white" />
                            </div>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                {dataSources.filter((s) => s.status.toLowerCase() === "connected").length} Active
                            </Badge>
                        </div>
                        <h3 className="text-xl font-semibold mt-4 text-gray-900">Data Sources</h3>
                        <p className="text-gray-600 mt-1">Manage your connected data integrations</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="bg-green-500 p-3 rounded-full">
                                <CheckCircle2 className="h-6 w-6 text-white" />
                            </div>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                QuickBooks
                            </Badge>
                        </div>
                        <h3 className="text-xl font-semibold mt-4 text-gray-900">Connected Services</h3>
                        <p className="text-gray-600 mt-1">View and manage your connected services</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="bg-purple-500 p-3 rounded-full">
                                <RefreshCw className="h-6 w-6 text-white" />
                            </div>
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                                {dataSources.length} Total
                            </Badge>
                        </div>
                        <h3 className="text-xl font-semibold mt-4 text-gray-900">Sync Status</h3>
                        <p className="text-gray-600 mt-1">Monitor your data synchronization status</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-lg border-gray-200 overflow-hidden mx-auto">
                <CardHeader className="bg-white border-b border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-gray-900">Data Sources</CardTitle>
                            <CardDescription className="text-gray-500 mt-1">
                                Manage your QuickBooks and other data connections
                            </CardDescription>
                        </div>
                        <Button
                            className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all"
                            onClick={() => handleConnect("")}
                        >
                            Add New Connection
                        </Button>
                    </div>
                </CardHeader>

                <div className="border-b border-gray-100">
                    <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                        <div className="px-6 pt-4">
                            <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto bg-gray-100 p-1 rounded-md">
                                <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    All
                                </TabsTrigger>
                                <TabsTrigger value="connected" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    Connected
                                </TabsTrigger>
                                <TabsTrigger
                                    value="disconnected"
                                    className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                >
                                    Disconnected
                                </TabsTrigger>
                                <TabsTrigger value="expired" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    Expired
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col justify-center items-center h-64 bg-gray-50 w-full">
                                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                                <span className="text-lg text-gray-600">Loading your data sources...</span>
                                <p className="text-gray-400 mt-2">This may take a moment</p>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 p-8 rounded-md flex flex-col items-center justify-center w-full">
                                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                                <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
                                <p className="text-red-600 text-center">{error}</p>
                                <Button
                                    variant="outline"
                                    className="mt-4 border-red-300 text-red-700 hover:bg-red-50"
                                    onClick={refreshData}
                                >
                                    Try Again
                                </Button>
                            </div>
                        ) : filteredSources.length === 0 ? (
                            <div className="text-center py-16 px-6 bg-gray-50 w-full">
                                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">No data sources found</h3>
                                <p className="text-gray-500 max-w-md mx-auto mb-6">
                                    {activeTab === "all"
                                        ? "You don't have any data sources connected yet. Add your first connection to get started."
                                        : `You don't have any ${activeTab.toLowerCase()} data sources.`}
                                </p>
                                <Button
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all"
                                    onClick={() => handleConnect("")}
                                >
                                    Connect QuickBooks
                                </Button>
                            </div>
                        ) : (
                            <div className="p-6">
                                <div className="overflow-x-auto w-full border border-gray-200 rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 border-b border-gray-200">
                                                <TableHead className="py-4 font-semibold text-gray-700">Name</TableHead>
                                                <TableHead className="py-4 font-semibold text-gray-700">Type</TableHead>
                                                <TableHead className="py-4 font-semibold text-gray-700">Status</TableHead>
                                                <TableHead className="py-4 font-semibold text-gray-700">Last Refreshed</TableHead>
                                                <TableHead className="py-4 font-semibold text-gray-700">ID</TableHead>
                                                <TableHead className="py-4 font-semibold text-gray-700">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSources.map((source) => (
                                                <TableRow
                                                    key={source.id}
                                                    className="hover:bg-blue-50/30 transition-colors"
                                                >
                                                    <TableCell className="py-4 font-medium text-gray-900">{source.name}</TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                            {source.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Badge variant="outline" className={`flex items-center ${getStatusColor(source.status)}`}>
                                                            {getStatusIcon(source.status)}
                                                            {source.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-4 text-gray-600">
                                                        <div className="flex items-center">
                                                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                                            {formatDate(source.last_refreshed_at)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="text-xs font-mono bg-gray-50 rounded px-2 py-1 text-gray-600">
                                                            {source.id.substring(0, 8)}...
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        {source.status === "CONNECTED" && (
                                                            <Button
                                                                variant="destructive"
                                                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow-md transition-all"
                                                                size="sm"
                                                                onClick={() => handleDisconnect(source.id)}
                                                            >
                                                                Disconnect
                                                            </Button>
                                                        )}
                                                        {source.status === "DISCONNECTED" && (
                                                            <Button
                                                                variant="default"
                                                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm hover:shadow-md transition-all"
                                                                size="sm"
                                                                onClick={() => handleConnect(source.id)}
                                                            >
                                                                Connect
                                                            </Button>
                                                        )}
                                                        {source.status === "EXPIRED" && (
                                                            <Button
                                                                variant="default"
                                                                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm hover:shadow-md transition-all"
                                                                size="sm"
                                                                onClick={() => handleConnect(source.id)}
                                                            >
                                                                Reconnect
                                                            </Button>
                                                        )}
                                                        {source.status === "DELETED" && (
                                                            <Button
                                                                variant="outline"
                                                                className="text-gray-500 border-gray-300 bg-gray-50"
                                                                size="sm"
                                                                disabled
                                                            >
                                                                Deleted
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </Tabs>
                </div>
            </Card>
        </>
    )

    const renderProfileContent = () => (
        <Card className="shadow-lg border-gray-200 overflow-hidden mx-auto">
            <CardHeader className="bg-white border-b border-gray-100 p-6">
                <CardTitle className="text-2xl font-bold text-gray-900">Profile Settings</CardTitle>
                <CardDescription className="text-gray-500 mt-1">
                    Manage your personal account information
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <p className="text-gray-600">Your profile settings content goes here.</p>
            </CardContent>
        </Card>
    )

    const renderSecurityContent = () => (
        <Card className="shadow-lg border-gray-200 overflow-hidden mx-auto">
            <CardHeader className="bg-white border-b border-gray-100 p-6">
                <CardTitle className="text-2xl font-bold text-gray-900">Security Settings</CardTitle>
                <CardDescription className="text-gray-500 mt-1">
                    Manage your account security and privacy
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <p className="text-gray-600">Your security settings content goes here.</p>
            </CardContent>
        </Card>
    )

    const renderConfigItem = (item: ConfigItem) => {
        const renderInput = () => {
            switch (item.type) {
                case 'email':
                case 'string':
                    return (
                        <input
                            type={item.type === 'email' ? 'email' : 'text'}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full max-w-md"
                            defaultValue={item.defaultValue}
                            placeholder={`Enter ${item.name.toLowerCase()}`}
                        />
                    );
                case 'boolean':
                    return (
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                defaultChecked={item.defaultValue}
                            />
                        </div>
                    );
                case 'single-select':
                    return (
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full max-w-md"
                            defaultValue={item.defaultValue}
                        >
                            {item.options?.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    );
                case 'multi-select':
                    return (
                        <select
                            multiple
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full max-w-md"
                            defaultValue={item.defaultValue}
                        >
                            {item.options?.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    );
                default:
                    return null;
            }
        };

        return (
            <Card key={item.key} className="border border-gray-200 mb-4">
                <CardContent className="p-4">
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                <p className="text-sm text-gray-500">Key: {item.key}</p>
                            </div>
                        </div>
                        <div className="mt-2">
                            {renderInput()}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const renderConfigurationContent = () => (
        <Card className="shadow-lg border-gray-200 overflow-hidden mx-auto">
            <CardHeader className="bg-white border-b border-gray-100 p-6">
                <CardTitle className="text-2xl font-bold text-gray-900">Configuration Settings</CardTitle>
                <CardDescription className="text-gray-500 mt-1">
                    Configure system-wide settings and preferences
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                {isLoadingConfig ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-600">Loading configuration settings...</p>
                    </div>
                ) : configError ? (
                    <div className="bg-red-50 p-4 rounded-md">
                        <AlertCircle className="h-5 w-5 text-red-500 mb-2" />
                        <p className="text-red-700">{configError}</p>
                    </div>
                ) : configData ? (
                    <div className="space-y-8">
                        {/* Organization Configuration */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Settings</h3>
                            <div className="space-y-4">
                                {configData.organizationConfig.map((item) => renderConfigItem(item))}
                            </div>
                        </div>

                        {/* Company Configuration */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Settings</h3>
                            <div className="space-y-4">
                                {configData.companyConfig.map((item) => renderConfigItem(item))}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end mt-6">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                Save Changes
                            </Button>
                        </div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );

    const renderCompanyConfigContent = () => {
        const [configData, setConfigData] = useState<ConfigSection | null>(null);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
            const fetchConfig = async () => {
                try {
                    setIsLoading(true);
                    const data = await getConfigurationTemplate();
                    setConfigData(data);
                    setError(null);
                } catch (err) {
                    console.error("Error fetching configuration:", err);
                    setError("Failed to load configuration settings");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchConfig();
        }, []);

        return (
            <Card className="shadow-lg border-gray-200 overflow-hidden mx-auto">
                <CardHeader className="bg-white border-b border-gray-100 p-6">
                    <CardTitle className="text-2xl font-bold text-gray-900">Company Settings</CardTitle>
                    <CardDescription className="text-gray-500 mt-1">
                        Configure your company settings and preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                            <p className="text-gray-600">Loading configuration settings...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 p-4 rounded-md">
                            <AlertCircle className="h-5 w-5 text-red-500 mb-2" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    ) : configData ? (
                        <div className="space-y-6">
                            {/* Company Configuration */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Settings</h3>
                                <div className="space-y-4">
                                    {configData.companyConfig.map((item) => renderConfigItem(item))}
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end mt-6">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </CardContent>
            </Card>
        );
    };

    const sidebarItems: SidebarItem[] = [
        {
            id: "data-connections",
            label: "Data Connections",
            icon: <Database className="h-5 w-5" />,
            content: renderDataConnectionsContent()
        },
        {
            id: "configuration",
            label: "Configuration",
            icon: <Building className="h-5 w-5" />,
            content: renderCompanyConfigContent()
        },
        {
            id: "profile",
            label: "Profile",
            icon: <User className="h-5 w-5" />,
            content: renderProfileContent()
        },
        {
            id: "security",
            label: "Security",
            icon: <ShieldCheck className="h-5 w-5" />,
            content: renderSecurityContent()
        }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="flex">
                {/* Collapsible Desktop Sidebar */}
                <div className={cn(
                    "hidden md:flex flex-col bg-white border-r border-gray-200 min-h-screen transition-all duration-300",
                    sidebarExpanded ? "w-64" : "w-16"
                )}>
                    <div className={cn(
                        "flex items-center justify-between p-4 border-b border-gray-100",
                        sidebarExpanded ? "px-6" : "px-3"
                    )}>
                        <div className="flex items-center gap-2 overflow-hidden">
                            {sidebarExpanded  && <Settings className="h-6 w-6 text-blue-600 flex-shrink-0" />}
                            {sidebarExpanded && <h2 className="text-xl font-bold text-gray-900 truncate">Settings</h2>}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 rounded-full hover:bg-gray-100"
                            onClick={() => setSidebarExpanded(!sidebarExpanded)}
                        >
                            {sidebarExpanded ? (
                                <ChevronLeft className="h-5 w-5 text-gray-500" />
                            ) : (
                                <ChevronRight className="h-5 w-5 text-gray-500" />
                            )}
                        </Button>
                    </div>
                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul className="space-y-1">
                            <TooltipProvider>
                                {sidebarItems.map((item) => (
                                    <li key={item.id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => setActiveSidebarItem(item.id)}
                                                    className={cn(
                                                        "flex items-center w-full text-left transition-colors",
                                                        sidebarExpanded ? "px-6 py-3" : "px-0 py-3 justify-center",
                                                        activeSidebarItem === item.id
                                                            ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600"
                                                            : "text-gray-700 hover:bg-gray-100 border-r-4 border-transparent"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "text-gray-500",
                                                        sidebarExpanded ? "mr-3" : "mx-auto"
                                                    )}>
                                                        {item.icon}
                                                    </span>
                                                    {sidebarExpanded && <span className="truncate">{item.label}</span>}
                                                </button>
                                            </TooltipTrigger>
                                            {!sidebarExpanded && (
                                                <TooltipContent side="right" sideOffset={10}>
                                                    {item.label}
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </li>
                                ))}
                            </TooltipProvider>
                            <li className={cn(
                                sidebarExpanded ? "px-6 pt-4 mt-4" : "px-3 pt-4 mt-4",
                                "border-t border-gray-200"
                            )}>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                className={cn(
                                                    "bg-red-500 hover:bg-red-600 text-white",
                                                    sidebarExpanded ? "w-full justify-start" : "w-10 h-10 p-0"
                                                )}
                                                onClick={handleLogout}
                                            >
                                                <LogOut className={cn(
                                                    "h-5 w-5",
                                                    sidebarExpanded ? "mr-2" : ""
                                                )} />
                                                {sidebarExpanded && <span>Logout</span>}
                                            </Button>
                                        </TooltipTrigger>
                                        {!sidebarExpanded && (
                                            <TooltipContent side="right" sideOffset={10}>
                                                Logout
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            </li>
                        </ul>
                    </nav>
                </div>

                {/* Mobile Header with Sheet */}
                <div className="md:hidden w-full bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" className="p-2 mr-2 hover:bg-gray-100">
                                        <Menu className="h-5 w-5 text-gray-700" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[240px] p-0">
                                    <div className="flex flex-col h-full">
                                        <div className="p-4 border-b border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <Settings className="h-6 w-6 text-blue-600" />
                                                <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                                            </div>
                                        </div>
                                        <nav className="flex-1 overflow-y-auto py-4">
                                            <ul className="space-y-1">
                                                {sidebarItems.map((item) => (
                                                    <li key={item.id}>
                                                        <button
                                                            onClick={() => {
                                                                setActiveSidebarItem(item.id);
                                                                setMobileSheetOpen(false);
                                                            }}
                                                            className={cn(
                                                                "flex items-center w-full px-6 py-3 text-left transition-colors",
                                                                activeSidebarItem === item.id
                                                                    ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600"
                                                                    : "text-gray-700 hover:bg-gray-100"
                                                            )}
                                                        >
                                                            <span className="mr-3 text-gray-500">{item.icon}</span>
                                                            <span>{item.label}</span>
                                                        </button>
                                                    </li>
                                                ))}
                                                <li className="px-6 pt-4 mt-4 border-t border-gray-200">
                                                    <Button
                                                        variant="destructive"
                                                        className="w-full justify-start bg-red-500 hover:bg-red-600 text-white"
                                                        onClick={() => {
                                                            handleLogout();
                                                            setMobileSheetOpen(false);
                                                        }}
                                                    >
                                                        <LogOut className="h-5 w-5 mr-2" />
                                                        <span>Logout</span>
                                                    </Button>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
                                </SheetContent>
                            </Sheet>
                            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                        </div>

                        <div className="flex items-center">
                            <Button
                                variant="ghost"
                                className="mr-2 p-2 hover:bg-gray-100"
                                onClick={() => router.push('/')}
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-700" />
                            </Button>

                            {/* Mobile logout button */}
                            <Button
                                variant="destructive"
                                size="sm"
                                className="bg-red-500 hover:bg-red-600 text-white"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4 mr-1" />
                                Logout
                            </Button>
                        </div>
                    </div>

                    {/* Mobile tab navigation */}
                    <div className="mt-4">
                        <Tabs value={activeSidebarItem} onValueChange={setActiveSidebarItem}>
                            <TabsList className="w-full grid grid-cols-3 bg-gray-100 p-1 rounded-md">
                                {sidebarItems.map((item) => (
                                    <TabsTrigger
                                        key={item.id}
                                        value={item.id}
                                        className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                    >
                                        <span className="flex items-center">
                                            <span className="mr-2">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </span>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="md:hidden">
                            {/* Only show this in mobile view */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                                <p className="text-gray-500">Manage your account settings and preferences</p>
                                <Button
                                    variant="outline"
                                    className="mt-4 md:mt-0 flex items-center gap-2 hover:bg-gray-100 transition-colors"
                                    onClick={refreshData}
                                    disabled={isRefreshing}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                                    {isRefreshing ? "Refreshing..." : "Refresh"}
                                </Button>
                            </div>
                        </div>

                        <div className="hidden md:block">
                            {/* Only show this in desktop view */}
                            <div className="flex items-center mb-6">
                                <Button
                                    variant="ghost"
                                    className="mr-4 p-2 hover:bg-gray-100"
                                    onClick={() => router.push('/')}
                                >
                                    <ArrowLeft className="h-5 w-5 text-gray-700" />
                                </Button>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {sidebarItems.find(item => item.id === activeSidebarItem)?.label || "Settings"}
                                </h1>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                                <p className="text-gray-500">
                                    {activeSidebarItem === "data-connections" && "Manage your data connections and account settings"}
                                    {activeSidebarItem === "profile" && "Update your personal information and preferences"}
                                    {activeSidebarItem === "security" && "Configure security settings and privacy options"}
                                    {activeSidebarItem === "configuration" && "Configure system-wide settings and preferences"}
                                </p>
                                {activeSidebarItem === "data-connections" && (
                                    <Button
                                        variant="outline"
                                        className="mt-4 md:mt-0 flex items-center gap-2 hover:bg-gray-100 transition-colors"
                                        onClick={refreshData}
                                        disabled={isRefreshing}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                                        {isRefreshing ? "Refreshing..." : "Refresh"}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Content based on selected sidebar item */}
                        {sidebarItems.find(item => item.id === activeSidebarItem)?.content}
                    </div>
                </div>
            </div>
        </div>
    )
}