"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ItemCard, ItemCardSkeleton } from "@/components/ItemCard";
import { MatchedItemCard } from "@/components/MatchedItemCard";
import { apiClient } from "@/lib/apiClient";
import { Item } from "@/types/item";
import { RecentLostItems } from "@/components/RecentLostItems";
import { CampusMap } from "@/components/CampusMap";
import { HiAcademicCap, HiCheckCircle, HiBell, HiSearch, HiCamera, HiLocationMarker, HiUserGroup, HiGlobe, HiMap, HiHeart } from "react-icons/hi";

type MatchedItem = Item & {
  matchedAt?: string;
  claimerId?: string;
  claimMessage?: string;
};

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatched, setLoadingMatched] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await apiClient.get<{ items: Item[] } | Item[]>("/api/items");
        const parsed = Array.isArray(response)
          ? response
          : Array.isArray((response as { items: Item[] }).items)
            ? (response as { items: Item[] }).items
            : [];
        setItems(parsed);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load items.";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Fetch recent matched items
  useEffect(() => {
    const fetchMatchedItems = async () => {
      try {
        const response = await apiClient.get<MatchedItem[]>("/api/items/matched");
        setMatchedItems(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error("Error fetching matched items:", err);
        setMatchedItems([]);
      } finally {
        setLoadingMatched(false);
      }
    };

    fetchMatchedItems();
  }, []);

  const foundItems = useMemo(
    () => items.filter((item) => item.status === "found").slice(0, 3),
    [items],
  );

  return (
    <div className="space-y-14">
      <section className="grid items-center gap-10 rounded-3xl bg-card px-6 py-10 shadow-sm md:grid-cols-2 md:px-10 md:py-14 hero-shell">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm font-semibold text-primary shadow-sm">
            <HiAcademicCap /> Campus Safety First
          </p>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl gradient-text">
            Find lost belongings fast with CampusLost+Found
          </h1>
          <p className="text-lg text-muted">
            A dedicated hub for students to report lost or found items, coordinate pickups, and keep campus belongings safe.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/items" className="btn btn-primary">
              Browse items
            </Link>
            <Link href="/login" className="btn btn-secondary">
              Login to report
            </Link>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted">
            <span className="flex items-center gap-2"><HiCheckCircle /> Verified campus community</span>
            <span className="flex items-center gap-2"><HiBell /> Instant updates</span>
            <span className="flex items-center gap-2"><HiMap /> Clear pickup details</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-primary opacity-10 blur-3xl" />
          <Image
            src="/hero.png"
            alt="CampusLost+Found hero"
            width={600}
            height={500}
            className="w-full rounded-2xl border border-base shadow-lg"
            priority
          />
        </div>
      </section>

      <section className="section-shell">
        <div>
          <h2 className="section-title">How it works</h2>
          <p className="section-subtitle">Three simple steps to reunite items with their owners.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Browse", description: "Check recent lost and found items posted by the community." },
            { title: "Login", description: "Sign in to track updates and reach out to reporters securely." },
            { title: "Report", description: "Report a lost or found item with location and images." },
          ].map((step, idx) => (
            <div key={step.title} className="card">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold">
                {idx + 1}
              </div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="text-sm text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Recent lost items</h2>
            <p className="section-subtitle">Spotted something? Help a fellow student out.</p>
          </div>
          <Link href="/items?filter=lost" className="text-sm font-semibold text-primary">
            View all →
          </Link>
        </div>
        <RecentLostItems />
      </section>

      <section className="section-shell">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Recent matched items</h2>
            <p className="section-subtitle">Successfully reunited items with their owners.</p>
          </div>
        </div>
        {loadingMatched ? (
          <div className="grid gap-4 md:grid-cols-3">
            <ItemCardSkeleton />
            <ItemCardSkeleton />
            <ItemCardSkeleton />
          </div>
        ) : matchedItems.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {matchedItems.map((item) => (
              <MatchedItemCard key={item._id} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-base bg-card p-8 text-center">
            <HiHeart className="text-4xl text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">No recent matches yet. Be the first to help reunite an item!</p>
          </div>
        )}
      </section>

      <section className="section-shell">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Recent found items</h2>
            <p className="section-subtitle">See what&apos;s been found around campus.</p>
          </div>
          <Link href="/items?filter=found" className="text-sm font-semibold text-primary">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <ItemCardSkeleton />
            <ItemCardSkeleton />
            <ItemCardSkeleton />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : foundItems.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {foundItems.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No found items posted yet.</p>
        )}
      </section>

      <section className="section-shell">
        <div>
          <h2 className="section-title">Why CampusLost+Found</h2>
          <p className="section-subtitle">We blend speed, safety, and clarity for campus communities.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Campus-first", description: "Built for students and staff with campus-friendly flows." },
            { title: "Secure & verified", description: "Cookie-based sessions and backend checks keep data safe." },
            { title: "Human support", description: "Clear instructions, real updates, and simple actions." },
          ].map((item) => (
            <div key={item.title} className="card">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="text-sm text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <div>
          <h2 className="section-title">About CampusLost+Found</h2>
          <p className="section-subtitle">
            Connecting the campus community to reunite lost items with their owners.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card space-y-4">
            <h3 className="text-xl font-semibold">Our Mission</h3>
            <p className="text-muted">
              CampusLost+Found is dedicated to creating a safe, efficient, and community-driven platform 
              for students and staff to report and recover lost items on campus. We believe in the power 
              of community to help one another and make campus life easier.
            </p>
          </div>
          <div className="card space-y-4">
            <h3 className="text-xl font-semibold">How We Help</h3>
            <p className="text-muted">
              Our platform streamlines the lost and found process by providing a centralized location 
              where items can be reported, searched, and claimed. With detailed descriptions, location 
              information, and images, finding lost belongings has never been easier.
            </p>
          </div>
        </div>
        <div className="card space-y-4">
          <h3 className="text-xl font-semibold">Key Features</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: HiSearch, title: "Easy Search", desc: "Quickly search through all reported items with filters and keywords." },
              { icon: HiCamera, title: "Photo Support", desc: "Upload images to help identify lost items more accurately." },
              { icon: HiLocationMarker, title: "Location Tracking", desc: "Pinpoint exact locations where items were found or lost." },
              { icon: HiBell, title: "Instant Updates", desc: "Get notified when items matching your search are posted." },
              { icon: HiCheckCircle, title: "Verified Users", desc: "Secure authentication ensures only campus members can participate." },
              { icon: HiUserGroup, title: "Community Driven", desc: "Built by students, for students, fostering a helpful campus culture." },
            ].map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div key={feature.title} className="space-y-2">
                  <IconComponent className="text-2xl text-primary" />
                  <h4 className="font-semibold">{feature.title}</h4>
                  <p className="text-sm text-muted">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div>
          <h2 className="section-title">Campus Location</h2>
          <p className="section-subtitle">
            Find us at Dhaka University. Check the map below for our campus area.
          </p>
        </div>
        <CampusMap />
        <div className="mt-4 rounded-xl border border-base bg-card p-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="font-semibold text-primary flex items-center gap-2"><HiLocationMarker /> Address</p>
              <p className="text-muted">Dhaka University Area, Dhaka, Bangladesh</p>
            </div>
            <div>
              <p className="font-semibold text-primary flex items-center gap-2"><HiGlobe /> Coordinates</p>
              <p className="text-muted">23.7336° N, 90.3927° E</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell rounded-2xl bg-card px-6 py-6 shadow-sm md:px-8">
        <h2 className="section-title">Safety notice</h2>
        <p className="text-muted">
          Always meet in well-lit, public areas on campus when exchanging items. Verify student IDs if needed and never share sensitive personal information.
        </p>
      </section>

      <section className="section-shell rounded-2xl bg-primary text-white px-6 py-8 shadow-lg md:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title text-white">Ready to get started?</h2>
            <p className="text-primary-white">Explore items or sign in to report your own.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/items" className="btn bg-white text-primary">
              View items
            </Link>
            <Link href="/login" className="btn btn-secondary border-white/60 text-white hover:bg-white/10">
              Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
