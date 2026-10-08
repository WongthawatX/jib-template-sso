import { Card } from "@/components/ui/card";

export default function DashboardPage() {
    return (
        <div className="space-y-5">
            {[1,2,3,4,5,6,7,8,9,10,12,13,14,15].map(( id ) => (
                <Card key={id} className="p-5">
                    { id }
                </Card>
            )) }
        </div>
    )
}
