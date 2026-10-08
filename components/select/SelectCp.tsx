"use client"

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

import { cn } from "@/lib/utils"

export type SelectOption = { value: string; label: string; title?: string; disabled?: boolean }

type Props = {
    placeholder: string
    options: SelectOption[]
    value: string | undefined
    onChange: ( value: string | undefined ) => void
    className?: string
    disabled?: boolean | undefined
}

export default function SelectCp({ placeholder, options, value, onChange, className, disabled }: Props) {
    return (
        <Select
            value={value}
            onValueChange={( next ) => onChange( next ?? undefined )}
            disabled={disabled}
        >
            <SelectTrigger className={cn("min-w-0 w-full", className)}>
                <SelectValue
                    placeholder={placeholder}
                    className="min-w-0 flex-1 truncate overflow-hidden text-left"
                />
            </SelectTrigger>
            <SelectContent
                side="bottom"
                align="start"
                sideOffset={4}
                className={cn("max-h-[min(50vh,320px)]", "min-w-(--anchor-width) max-w-[min(100vw-2rem,22rem)]")}
            >
                <SelectGroup>
                    { options.map(( option: SelectOption ) => {
                        const fullLabel = option.title ? `${option.label} ( ${option.title} )` : option.label

                        return (
                            <SelectItem key={ option.value } value={ option.value } disabled={ option.disabled }>
                                <div className="line-clamp-1 min-w-0 text-left text-sm leading-tight wrap-break-word" title={fullLabel}>
                                    <span className="text-foreground"> { option.label } </span>
                                    { option.title ? (
                                        <span className="text-xs text-muted-foreground">
                                            {" "}( { option.title } )
                                        </span>
                                    ) : null }
                                </div>
                            </SelectItem>
                        )
                    })}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
