import { Card } from "@/components/ui/card";

export default function DashboardPage() {
    return (
        <div className="space-y-10">
            {[1,2,3,4,5,6,7,8,9,10].map(( id ) => (
                <Card key={id}>
                    { id }
                </Card>
            )) }
        </div>
    )
}
