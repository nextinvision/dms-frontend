"use client";

import { use } from "react";
import JobCardForm from "../../../components/job-cards/JobCardForm";

interface EditJobCardPageProps {
    params: Promise<{ id: string }>;
}

export default function EditJobCardPage({ params }: EditJobCardPageProps) {
    const { id } = use(params);

    return <JobCardForm mode="edit" jobCardId={id} />;
}
