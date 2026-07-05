import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LoginFormPlaceholder() {
  return (
    <Card className="w-full max-w-md border-border bg-card shadow-none">
      <CardHeader className="space-y-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-brand text-sm font-bold text-brand-foreground">
          R24
        </div>
        <div>
          <CardTitle className="text-xl">Sign in to Data Studio</CardTitle>
          <CardDescription className="mt-1.5">
            Internal access for Admin, Collector, and Reviewer roles.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-md border border-border bg-background p-4">
          <p className="text-sm text-muted-foreground">Email</p>
          <div className="h-9 rounded-md border border-input bg-surface" />
        </div>
        <div className="space-y-2 rounded-md border border-border bg-background p-4">
          <p className="text-sm text-muted-foreground">Password</p>
          <div className="h-9 rounded-md border border-input bg-surface" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Badge variant="outline">Firebase Auth — coming soon</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
