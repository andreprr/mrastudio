export type BookingStatus =
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "rejected"
    | "expired";

export interface ServiceItem {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    duration_minutes: number;
    image_url: string | null;
    is_active: boolean;
    sort_order: number;
}

export interface BarberItem {
    id: string;
    name: string;
    bio: string | null;
    specialty: string;
    photo_url: string | null;
    card_theme: "beige" | "peach" | "charcoal" | "cream";
    is_active: boolean;
}

export interface BusinessHour {
    id: string;
    day_of_week: number;
    open_time: string;
    close_time: string;
    is_closed: boolean;
    break_start: string | null;
    break_end: string | null;
}

export interface BarberSchedule {
    id: string;
    barber_id: string;
    schedule_date: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
    note: string | null;
}

export interface BookingRecord {
    id: string;
    booking_code: string;
    customer_name: string;
    customer_phone: string;
    service_id: string | null;
    service_name_snapshot: string;
    price_snapshot: number;
    duration_snapshot: number;
    barber_id: string | null;
    barber_name_snapshot: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    status: BookingStatus;
    customer_note: string | null;
    admin_note: string | null;
    expires_at: string;
    created_at: string;
}

export interface GalleryItem {
    id: string;
    title: string;
    description: string | null;
    image_url: string;
    category: string;
    aspect_ratio: "portrait" | "square" | "landscape";
    sort_order: number;
    is_published: boolean;
}

export interface ReviewItem {
    id: string;
    customer_name: string;
    rating: number;
    comment: string;
    status: "pending" | "approved" | "hidden";
    created_at: string;
}

export interface GeneralSettings {
    brand_name: string;
    hero_headline: string;
    hero_subheadline: string;
    about_title: string;
    about_story: string;
    about_philosophy: string;
    address: string;
    whatsapp: string;
    instagram: string;
    cancellation_policy: string;
    late_tolerance_minutes: number;
    booking_window_days: number;
    slot_interval_minutes: number;
    buffer_minutes: number;
    pending_expiry_minutes: number;
}