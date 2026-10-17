import { z } from "zod";

export const createBookingSchema = z.object({
    service_id: z.string().uuid({ message: "Pilih layanan yang valid." }),
    booking_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, {
            message: "Format tanggal tidak valid (YYYY-MM-DD).",
        }),
    barber_id: z.string().uuid().nullable().optional(),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, {
        message: "Format waktu tidak valid (HH:MM).",
    }),
    customer_name: z
        .string()
        .min(2, { message: "Nama lengkap minimal 2 karakter." })
        .max(80, { message: "Nama lengkap terlalu panjang." }),
    customer_phone: z
        .string()
        .regex(/^(\+62|62|0)8[1-9][0-9]{7,11}$/, {
            message:
                "Masukkan nomor WhatsApp Indonesia yang valid (contoh: 081234567890).",
        }),
    customer_note: z
        .string()
        .max(300, { message: "Catatan maksimal 300 karakter." })
        .optional()
        .or(z.literal("")),
    agree_terms: z.boolean().refine((val) => val === true, {
        message: "Anda wajib menyetujui syarat booking dan kebijakan privasi.",
    }),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const checkBookingSchema = z.object({
    booking_code: z
        .string()
        .min(6, {
            message: "Masukkan kode booking yang valid (contoh: MRA-1A2B3C4D).",
        })
        .max(20),
    customer_phone: z
        .string()
        .min(9, {
            message: "Masukkan nomor WhatsApp yang digunakan saat booking.",
        }),
});