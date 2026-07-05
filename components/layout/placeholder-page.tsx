import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed border-border bg-background/50">
          <p className="text-sm text-muted-foreground">
            Module scaffold ready — business logic coming in a future phase.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
