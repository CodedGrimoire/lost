import { Suspense } from "react";
import ItemsClient from "./ItemsClient";

export default function ItemsPage() {
  return (
    <Suspense fallback={<div>Loading items...</div>}>
      <ItemsClient />
    </Suspense>
  );
}
