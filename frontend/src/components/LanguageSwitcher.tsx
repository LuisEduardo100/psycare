"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransition } from "react";

export default function LanguageSwitcher() {
    const t = useTranslations("Common");
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const handleChange = (nextLocale: string) => {
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <Select value={locale} onValueChange={handleChange} disabled={isPending}>
            <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("loading")} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="pt">Português 🇧🇷</SelectItem>
                <SelectItem value="en">English 🇺🇸</SelectItem>
                <SelectItem value="es">Español 🇪🇸</SelectItem>
            </SelectContent>
        </Select>
    );
}
