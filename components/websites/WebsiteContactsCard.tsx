import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WebsiteRawDocument } from "@/lib/types/websites";

interface WebsiteContactsCardProps {
  website: WebsiteRawDocument;
}

export function WebsiteContactsCard({ website }: WebsiteContactsCardProps) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Public Contact Information</CardTitle>
        <CardDescription>Only publicly visible contact details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="text-muted-foreground">Email Addresses</p>
          {website.publicEmails.length === 0 ? (
            <p className="mt-1 text-muted-foreground">None detected</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {website.publicEmails.map((item) => (
                <li key={item.email}>
                  {item.email}{" "}
                  <span className="text-xs text-muted-foreground">({item.confidence})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-muted-foreground">Phone Numbers</p>
          {website.publicPhones.length === 0 ? (
            <p className="mt-1 text-muted-foreground">None detected</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {website.publicPhones.map((item) => (
                <li key={item.phone}>
                  {item.phone}{" "}
                  <span className="text-xs text-muted-foreground">({item.confidence})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {website.address ? (
          <div>
            <p className="text-muted-foreground">Address</p>
            <p className="mt-1">{website.address}</p>
            {[website.city, website.state, website.postalCode, website.country].filter(Boolean).length > 0 ? (
              <p className="text-muted-foreground">
                {[website.city, website.state, website.postalCode, website.country].filter(Boolean).join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
        {website.googleMapsUrl ? (
          <div>
            <p className="text-muted-foreground">Google Maps</p>
            <a href={website.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-brand hover:underline">
              View on Maps
            </a>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
