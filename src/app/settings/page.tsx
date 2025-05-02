"use client"

import { useState, useEffect } from "react"
import { getAllDataSources } from "@/lib/api/datasource"
import { store } from "@/lib/store/store"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Database, AlertCircle, CheckCircle2, XCircle, Clock, Trash2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { disconnectAccount, initAddQuickBookAccount } from "@/lib/api/intuitService"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

interface DataSource {
    id: string
    name: string
    type: string
    status: string
    last_refreshed_at: string
}

export default function SettingsPage() {
    const [dataSources, setDataSources] = useState<DataSource[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [activeTab, setActiveTab] = useState("all")
    const router = useRouter()

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

    const filteredSources =
        activeTab === "all"
            ? dataSources
            : dataSources.filter((source) => source.status.toLowerCase() === activeTab.toLowerCase())

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center mb-6">
                    <Button
                        variant="ghost"
                        className="mr-4 p-2 hover:bg-gray-100"
                        onClick={() => router.push('/')}
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-700" />
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <p className="text-gray-500">Manage your data connections and account settings</p>
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
            </div>
        </div>
    )
}