import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-4 border-b border-gray-200 bg-transparent">
          <TabsTrigger
            value="profile"
            className="p-4 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 hover:text-gray-900 hover:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="dashboard"
            className="p-4 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 hover:text-gray-900 hover:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="p-4 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 hover:text-gray-900 hover:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            Settings
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            className="p-4 text-sm font-medium text-gray-500 border-b-2 border-transparent data-[state=active]:text-gray-900 data-[state=active]:border-gray-900 hover:text-gray-900 hover:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            Contacts
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="profile"
          className="p-10 rounded-lg bg-gray-100 mt-0"
        >
          <p className="text-sm text-gray-500">
            This is some placeholder content the{" "}
            <strong className="font-medium text-gray-900">
              Profile tab&apos;s associated content
            </strong>
            . Clicking another tab will toggle the visibility of this one for
            the next. The tab JavaScript swaps classes to control the content
            visibility and styling.
          </p>
        </TabsContent>
        <TabsContent
          value="dashboard"
          className="p-4 rounded-lg bg-gray-100 mt-0"
        >
          <p className="text-sm text-gray-500">
            This is some placeholder content the{" "}
            <strong className="font-medium text-gray-900">
              Dashboard tab&apos;s associated content
            </strong>
            . Clicking another tab will toggle the visibility of this one for
            the next. The tab JavaScript swaps classes to control the content
            visibility and styling.
          </p>
        </TabsContent>
        <TabsContent
          value="settings"
          className="p-4 rounded-lg bg-gray-100 mt-0"
        >
          <p className="text-sm text-gray-500">
            This is some placeholder content the{" "}
            <strong className="font-medium text-gray-900">
              Settings tab&apos;s associated content
            </strong>
            . Clicking another tab will toggle the visibility of this one for
            the next. The tab JavaScript swaps classes to control the content
            visibility and styling.
          </p>
        </TabsContent>
        <TabsContent
          value="contacts"
          className="p-4 rounded-lg bg-gray-100 mt-0"
        >
          <p className="text-sm text-gray-500">
            This is some placeholder content the{" "}
            <strong className="font-medium text-gray-900">
              Contacts tab&apos;s associated content
            </strong>
            . Clicking another tab will toggle the visibility of this one for
            the next. The tab JavaScript swaps classes to control the content
            visibility and styling.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
