import { Event } from '@/services/eventService';

interface EventSchemaProps {
  event: Event;
}

export const EventSchema = ({ event }: EventSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "description": event.description,
    "image": event.image,
    "startDate": event.date,
    "endDate": event.date,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": event.location,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": event.location,
        "addressCountry": "IN"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": event.organizerName,
      "url": `https://eventdekho.com/profile/${event.organizerId}`
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "url": `https://eventdekho.com/post/${event.id}`
    },
    "performer": {
      "@type": "Organization",
      "name": event.organizerName
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const OrganizationSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "EventDekho",
    "url": "https://eventdekho.com",
    "logo": "https://eventdekho.com/logo.png",
    "description": "EventDekho is India's premier platform for discovering and sharing community events from schools, NGOs, and local organizations.",
    "sameAs": [
      "https://facebook.com/eventdekho",
      "https://twitter.com/eventdekho",
      "https://instagram.com/eventdekho"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "support@eventdekho.com"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const WebsiteSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "EventDekho",
    "url": "https://eventdekho.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://eventdekho.com/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export const BreadcrumbSchema = ({ items }: { items: Array<{ name: string; url: string }> }) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
