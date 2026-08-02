"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setHeaderData } from "@/redux/header";

interface HeaderUpdaterProps {
  title: string;
  breadcrumb: string;
}

export function HeaderUpdater({
  title,
  breadcrumb
}: Readonly<HeaderUpdaterProps>) {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setHeaderData({ title, breadcrumb }));
  }, [title, breadcrumb, dispatch]);
  return null;
}
