"use client";
import { useEffect } from "react";
import { useCart } from "./Cart";

/** Empties the bag once an order is confirmed. */
export function ClearBag() {
  const { clear } = useCart();
  useEffect(() => { clear(); }, [clear]);
  return null;
}
