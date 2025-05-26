"use client";

import { Button } from "@/components/ui/button";

interface Props {
    saveDashboard: (name: string) => void;
    savedDashboards: { id: string; name: string }[];
    loadDashboard: (id: string) => void;
}

export default function Footer(props: Props) {
    return (
        <div className="bg-gray-50 h-12 flex items-center justify-between px-4 border-t border-gray-200">
            <Button
                onClick={() => props.saveDashboard(prompt("Enter dashboard name") || "Untitled Dashboard")}
                variant="outline"
            >
                Save Dashboard
            </Button>
            <select
                onChange={(e) => props.loadDashboard(e.target.value)}
                className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 border border-gray-200 bg-white shadow-sm"
            >
                <option value="">Load Dashboard</option>
                {props.savedDashboards.map((dashboard) => (
                    <option key={dashboard.id} value={dashboard.id}>
                        {dashboard.name}
                    </option>
                ))}
            </select>
        </div>
    );
}