// src/components/calendar-date-picker.tsx

"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
} from "date-fns";
import { toDate } from "date-fns-tz";
import { DateRange } from "react-day-picker";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const multiSelectVariants = cva(
  "flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium text-gray-900 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 px-4 py-3",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-900 hover:bg-blue-50 hover:border-blue-300",
        destructive:
          "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300",
        outline:
          "border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300",
        secondary:
          "bg-gray-50 text-gray-700 hover:bg-gray-100",
        ghost: "border-transparent bg-transparent hover:bg-gray-50",
        link: "border-transparent bg-transparent underline-offset-4 hover:underline text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface CalendarDatePickerProps
  extends React.HTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
  id?: string;
  className?: string;
  date: DateRange | undefined;
  closeOnSelect?: boolean;
  numberOfMonths?: 1 | 2;
  onDateSelect: (range: { from: Date; to: Date }) => void;
  selectedTime?: Date;
  onTimeSelect?: (time: Date) => void;
  showTimeSelect?: boolean;
  showDateSelect?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  // New props for ticket sale period mode
  ticketSaleMode?: boolean;
  startTime?: Date | null;
  endTime?: Date | null;
  onStartTimeSelect?: (time: Date) => void;
  onEndTimeSelect?: (time: Date) => void;
}

export const CalendarDatePicker = React.forwardRef<
  HTMLButtonElement,
  CalendarDatePickerProps
>(
  (
    {
      id = "calendar-date-picker",
      className,
      date,
      closeOnSelect = false,
      numberOfMonths = 2,
      onDateSelect,
      selectedTime,
      onTimeSelect,
      showTimeSelect = false,
      showDateSelect = true,
      minDate,
      maxDate,
      placeholder,
      // New props for ticket sale period mode
      ticketSaleMode = false,
      startTime,
      endTime,
      onStartTimeSelect,
      onEndTimeSelect,
      variant,
      ...props
    },
    ref
  ) => {
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [selectedRange, setSelectedRange] = React.useState<string | null>(
      numberOfMonths === 2 ? "This Year" : "Today"
    );
    const [monthFrom, setMonthFrom] = React.useState<Date | undefined>(
      date?.from
    );
    const [yearFrom, setYearFrom] = React.useState<number | undefined>(
      date?.from?.getFullYear()
    );
    const [monthTo, setMonthTo] = React.useState<Date | undefined>(
      numberOfMonths === 2 ? date?.to : date?.from
    );
    const [yearTo, setYearTo] = React.useState<number | undefined>(
      numberOfMonths === 2 ? date?.to?.getFullYear() : date?.from?.getFullYear()
    );
    const [highlightedPart, setHighlightedPart] = React.useState<string | null>(
      null
    );

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const selectDateRange = (from: Date, to: Date, range: string) => {
      const startDate = startOfDay(toDate(from, { timeZone }));
      const endDate =
        numberOfMonths === 2 ? endOfDay(toDate(to, { timeZone })) : startDate;
      onDateSelect({ from: startDate, to: endDate });
      setSelectedRange(range);
      setMonthFrom(from);
      setYearFrom(from.getFullYear());
      setMonthTo(to);
      setYearTo(to.getFullYear());
      closeOnSelect && setIsPopoverOpen(false);
    };

    const handleDateSelect = (range: DateRange | undefined) => {
      if (range) {
        let from = startOfDay(toDate(range.from as Date, { timeZone }));
        let to = range.to ? endOfDay(toDate(range.to, { timeZone })) : from;
        if (numberOfMonths === 1) {
          if (date && range.from !== date.from) {
            to = from;
          } else {
            from = startOfDay(toDate(range.to as Date, { timeZone }));
          }
        }
        onDateSelect({ from, to });
        setMonthFrom(from);
        setYearFrom(from.getFullYear());
        setMonthTo(to);
        setYearTo(to.getFullYear());
      }
      setSelectedRange(null);
    };

    const handleMonthChange = (newMonthIndex: number, part: string) => {
      setSelectedRange(null);
      if (part === "from") {
        if (yearFrom !== undefined) {
          if (newMonthIndex < 0 || newMonthIndex > 11) return;
          const newMonth = new Date(yearFrom, newMonthIndex, 1);
          const from =
            numberOfMonths === 2
              ? startOfMonth(toDate(newMonth, { timeZone }))
              : date?.from
              ? new Date(
                  date.from.getFullYear(),
                  newMonth.getMonth(),
                  date.from.getDate()
                )
              : newMonth;
          const to =
            numberOfMonths === 2
              ? date?.to
                ? endOfDay(toDate(date.to, { timeZone }))
                : endOfMonth(toDate(newMonth, { timeZone }))
              : from;
          if (from <= to) {
            onDateSelect({ from, to });
            setMonthFrom(newMonth);
            setMonthTo(date?.to);
          }
        }
      } else {
        if (yearTo !== undefined) {
          if (newMonthIndex < 0 || newMonthIndex > 11) return;
          const newMonth = new Date(yearTo, newMonthIndex, 1);
          const from = date?.from
            ? startOfDay(toDate(date.from, { timeZone }))
            : startOfMonth(toDate(newMonth, { timeZone }));
          const to =
            numberOfMonths === 2
              ? endOfMonth(toDate(newMonth, { timeZone }))
              : from;
          if (from <= to) {
            onDateSelect({ from, to });
            setMonthTo(newMonth);
            setMonthFrom(date?.from);
          }
        }
      }
    };

    const handleYearChange = (newYear: number, part: string) => {
      setSelectedRange(null);
      if (part === "from") {
        if (years.includes(newYear)) {
          const newMonth = monthFrom
            ? new Date(newYear, monthFrom ? monthFrom.getMonth() : 0, 1)
            : new Date(newYear, 0, 1);
          const from =
            numberOfMonths === 2
              ? startOfMonth(toDate(newMonth, { timeZone }))
              : date?.from
              ? new Date(newYear, newMonth.getMonth(), date.from.getDate())
              : newMonth;
          const to =
            numberOfMonths === 2
              ? date?.to
                ? endOfDay(toDate(date.to, { timeZone }))
                : endOfMonth(toDate(newMonth, { timeZone }))
              : from;
          if (from <= to) {
            onDateSelect({ from, to });
            setYearFrom(newYear);
            setMonthFrom(newMonth);
            setYearTo(date?.to?.getFullYear());
            setMonthTo(date?.to);
          }
        }
      } else {
        if (years.includes(newYear)) {
          const newMonth = monthTo
            ? new Date(newYear, monthTo.getMonth(), 1)
            : new Date(newYear, 0, 1);
          const from = date?.from
            ? startOfDay(toDate(date.from, { timeZone }))
            : startOfMonth(toDate(newMonth, { timeZone }));
          const to =
            numberOfMonths === 2
              ? endOfMonth(toDate(newMonth, { timeZone }))
              : from;
          if (from <= to) {
            onDateSelect({ from, to });
            setYearTo(newYear);
            setMonthTo(newMonth);
            setYearFrom(date?.from?.getFullYear());
            setMonthFrom(date?.from);
          }
        }
      }
    };

    const today = new Date();

    const years = Array.from(
      { length: 6 }, // 6 years: current year + 5 years ahead
      (_, i) => today.getFullYear() + i
    );

    const dateRanges = [
      { label: "Hari Ini", start: today, end: today },
      { label: "Kemarin", start: subDays(today, 1), end: subDays(today, 1) },
      {
        label: "Minggu Ini",
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      },
      {
        label: "Minggu Lalu",
        start: subDays(startOfWeek(today, { weekStartsOn: 1 }), 7),
        end: subDays(endOfWeek(today, { weekStartsOn: 1 }), 7),
      },
      { label: "7 Hari Terakhir", start: subDays(today, 6), end: today },
      {
        label: "Bulan Ini",
        start: startOfMonth(today),
        end: endOfMonth(today),
      },
      {
        label: "Bulan Lalu",
        start: startOfMonth(subDays(today, today.getDate())),
        end: endOfMonth(subDays(today, today.getDate())),
      },
      { label: "Tahun Ini", start: startOfYear(today), end: endOfYear(today) },
      {
        label: "Tahun Lalu",
        start: startOfYear(subDays(today, 365)),
        end: endOfYear(subDays(today, 365)),
      },
    ];

    // Filter out unwanted date ranges for ticket sale mode
    const filteredDateRanges = ticketSaleMode
      ? dateRanges.filter(range =>
          !["Hari Ini", "Kemarin", "Minggu Ini", "Minggu Lalu", "7 Hari Terakhir", "Bulan Ini", "Bulan Lalu", "Tahun Ini", "Tahun Lalu"].includes(range.label)
        )
      : dateRanges;

    const handleMouseOver = (part: string) => {
      setHighlightedPart(part);
    };

    const handleMouseLeave = () => {
      setHighlightedPart(null);
    };

    const handleWheel = (event: React.WheelEvent, part: string) => {
      event.preventDefault();
      setSelectedRange(null);
      if (part === "firstDay") {
        if (date?.from) {
          const newDate = new Date(date.from);
          const increment = event.deltaY > 0 ? -1 : 1;
          newDate.setDate(newDate.getDate() + increment);
          if (date?.to && newDate <= date.to) {
            numberOfMonths === 2
              ? onDateSelect({ from: newDate, to: new Date(date.to) })
              : onDateSelect({ from: newDate, to: newDate });
            setMonthFrom(newDate);
          } else if (!date?.to && numberOfMonths === 1) {
            onDateSelect({ from: newDate, to: newDate });
            setMonthFrom(newDate);
          }
        }
      } else if (part === "firstMonth") {
        const currentMonth = monthFrom ? monthFrom.getMonth() : 0;
        const newMonthIndex = currentMonth + (event.deltaY > 0 ? -1 : 1);
        handleMonthChange(newMonthIndex, "from");
      } else if (part === "firstYear" && yearFrom !== undefined) {
        const newYear = yearFrom + (event.deltaY > 0 ? -1 : 1);
        handleYearChange(newYear, "from");
      } else if (part === "secondDay") {
        if (date?.to && date?.from) {
          const newDate = new Date(date.to);
          const increment = event.deltaY > 0 ? -1 : 1;
          newDate.setDate(newDate.getDate() + increment);
          if (newDate >= date.from) {
            onDateSelect({ from: new Date(date.from), to: newDate });
            setMonthTo(newDate);
          }
        }
      } else if (part === "secondMonth") {
        const currentMonth = monthTo ? monthTo.getMonth() : 0;
        const newMonthIndex = currentMonth + (event.deltaY > 0 ? -1 : 1);
        handleMonthChange(newMonthIndex, "to");
      } else if (part === "secondYear" && yearTo !== undefined) {
        const newYear = yearTo + (event.deltaY > 0 ? -1 : 1);
        handleYearChange(newYear, "to");
      }
    };

    React.useEffect(() => {
      const firstDayElement = document.getElementById(`firstDay-${id}`);
      const firstMonthElement = document.getElementById(`firstMonth-${id}`);
      const firstYearElement = document.getElementById(`firstYear-${id}`);
      const secondDayElement = document.getElementById(`secondDay-${id}`);
      const secondMonthElement = document.getElementById(`secondMonth-${id}`);
      const secondYearElement = document.getElementById(`secondYear-${id}`);

      const elements = [
        firstDayElement,
        firstMonthElement,
        firstYearElement,
        secondDayElement,
        secondMonthElement,
        secondYearElement,
      ];

      const addPassiveEventListener = (element: HTMLElement | null) => {
        if (element) {
          element.addEventListener(
            "wheel",
            handleWheel as unknown as EventListener,
            {
              passive: false,
            }
          );
        }
      };

      elements.forEach(addPassiveEventListener);

      return () => {
        elements.forEach((element) => {
          if (element) {
            element.removeEventListener(
              "wheel",
              handleWheel as unknown as EventListener
            );
          }
        });
      };
    }, [highlightedPart, date, handleWheel, id]);

    const isDateDisabled = (date: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // For event dates, require minimum 3 days in advance for preparation
      const minEventDate = new Date(today);
      minEventDate.setDate(today.getDate() + 3);

      if (minDate && date < minDate) return true;
      if (maxDate && date > maxDate) return true;

      // If this is for event date selection (showTimeSelect is true), enforce 3-day minimum
      if (showTimeSelect && date < minEventDate) return true;

      // General rule: cannot select past dates
      if (date < today) return true;

      return false;
    };

    const handleClose = () => setIsPopoverOpen(false);

    const handleTogglePopover = () => setIsPopoverOpen((prev) => !prev);

    const formatWithTz = (date: Date, fmt: string) => {
      const formatter = new Intl.DateTimeFormat('id-ID', {
        day: fmt.includes('dd') ? '2-digit' : undefined,
        month: fmt.includes('MMMM') ? 'long' : fmt.includes('LLL') ? 'short' : undefined,
        year: fmt.includes('y') ? 'numeric' : undefined,
        timeZone,
      });
      return formatter.format(date);
    };

    return (
      <>
        <style>
          {`
            .date-part {
              touch-action: none;
            }
          `}
        </style>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date"
              ref={ref}
              {...props}
              className={cn(
                "w-auto max-w-xs",
                multiSelectVariants({ variant, className })
              )}
              onClick={handleTogglePopover}
              suppressHydrationWarning
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate">
                {date?.from ? (
                  date.to ? (
                    <>
                      <span
                        id={`firstDay-${id}`}
                        className={cn(
                          "date-part",
                          highlightedPart === "firstDay" &&
                            "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("firstDay")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.from, "dd")}
                      </span>{" "}
                      <span
                        id={`firstMonth-${id}`}
                        className={cn(
                          "date-part",
                          highlightedPart === "firstMonth" &&
                            "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("firstMonth")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.from, "MMMM")}
                      </span>
                      ,{" "}
                      <span
                        id={`firstYear-${id}`}
                        className={cn(
                          "date-part",
                          highlightedPart === "firstYear" &&
                            "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("firstYear")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.from, "y")}
                      </span>
                      {numberOfMonths === 2 && (
                        <>
                          {" - "}
                          <span
                            id={`secondDay-${id}`}
                            className={cn(
                              "date-part",
                              highlightedPart === "secondDay" &&
                                "underline font-bold"
                            )}
                            onMouseOver={() => handleMouseOver("secondDay")}
                            onMouseLeave={handleMouseLeave}
                          >
                            {formatWithTz(date.to, "dd")}
                          </span>{" "}
                          <span
                            id={`secondMonth-${id}`}
                            className={cn(
                              "date-part",
                              highlightedPart === "secondMonth" &&
                                "underline font-bold"
                            )}
                            onMouseOver={() => handleMouseOver("secondMonth")}
                            onMouseLeave={handleMouseLeave}
                          >
                            {formatWithTz(date.to, "MMMM")}
                          </span>
                          ,{" "}
                          <span
                            id={`secondYear-${id}`}
                            className={cn(
                              "date-part",
                              highlightedPart === "secondYear" &&
                                "underline font-bold"
                            )}
                            onMouseOver={() => handleMouseOver("secondYear")}
                            onMouseLeave={handleMouseLeave}
                          >
                            {formatWithTz(date.to, "y")}
                          </span>
                        </>
                      )}
                      {showTimeSelect && selectedTime && (
                        <>
                          {" "}
                          <span>
                            {selectedTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <span
                        id="day"
                        className={cn(
                          "date-part",
                          highlightedPart === "day" && "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("day")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.from, "dd")}
                      </span>{" "}
                      <span
                        id="month"
                        className={cn(
                          "date-part",
                          highlightedPart === "month" && "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("month")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.from, "MMMM")}
                      </span>
                      ,{" "}
                      <span
                        id="year"
                        className={cn(
                          "date-part",
                          highlightedPart === "year" && "underline font-bold"
                        )}
                        onMouseOver={() => handleMouseOver("year")}
                        onMouseLeave={handleMouseLeave}
                      >
                        {formatWithTz(date.from, "y")}
                      </span>
                      {showTimeSelect && selectedTime && (
                        <>
                          {" "}
                          <span>
                            {selectedTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </>
                      )}
                    </>
                  )
                ) : (
                  <span>{ticketSaleMode ? "Pilih periode penjualan tiket" : (placeholder || `Pilih tanggal${showTimeSelect ? " dan waktu (min. 3 hari ke depan)" : ""}`)}</span>
                )}
              </span>
            </Button>
          </PopoverTrigger>
          {isPopoverOpen && (
            <PopoverContent
              className="w-auto bg-white border-2 border-gray-200 rounded-2xl shadow-xl p-6"
              align="center"
              avoidCollisions={false}
              onInteractOutside={handleClose}
              onEscapeKeyDown={handleClose}
              style={{
                maxHeight: "var(--radix-popover-content-available-height)",
                overflowY: "auto",
              }}
            >
              <div className="flex">
                {numberOfMonths === 2 && (
                  <div className="hidden md:flex flex-col gap-2 pr-6 text-left border-r-2 border-gray-200">
                    {filteredDateRanges.map(({ label, start, end }) => (
                      <Button
                        key={label}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "justify-start rounded-xl px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-transparent transition-all",
                          selectedRange === label &&
                            "bg-blue-100 text-blue-800 border-blue-300 shadow-sm"
                        )}
                        onClick={() => {
                          selectDateRange(start, end, label);
                          setMonthFrom(start);
                          setYearFrom(start.getFullYear());
                          setMonthTo(end);
                          setYearTo(end.getFullYear());
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                )}
                <div className={cn("flex flex-col lg:flex-row gap-4", ticketSaleMode && "lg:flex-row")}>
                  {ticketSaleMode ? (
                    <>
                      {/* Left: Start Time Picker */}
                      <div className="flex flex-col gap-2 p-4 border-r-2 border-gray-200 lg:w-32">
                        <label className="text-sm font-medium text-center text-gray-700">
                          Mulai Jam:
                        </label>
                        <Select
                          value={startTime ? `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}` : ""}
                          onValueChange={(value) => {
                            const [hours, minutes] = value.split(':').map(Number);
                            const newTime = new Date();
                            newTime.setHours(hours, minutes, 0, 0);
                            onStartTimeSelect?.(newTime);
                          }}
                        >
                          <SelectTrigger className="w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-2 border-gray-200 rounded-xl bg-white text-gray-900 hover:bg-gray-50">
                            <SelectValue placeholder="00:00" />
                          </SelectTrigger>
                          <SelectContent className="border-2 border-gray-200 rounded-xl bg-white shadow-lg max-h-60">
                            {Array.from({ length: 24 * 4 }, (_, i) => {
                              const hours = Math.floor(i / 4);
                              const minutes = (i % 4) * 15;
                              const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                              return (
                                <SelectItem key={i} value={timeString} className="hover:bg-blue-50 focus:bg-blue-50">
                                  {timeString}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Center: Date Picker */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex gap-2 ml-3">
                            <Select
                              onValueChange={(value) => {
                                handleMonthChange(months.indexOf(value), "from");
                                setSelectedRange(null);
                              }}
                              value={
                                monthFrom ? months[monthFrom.getMonth()] : undefined
                              }
                            >
                              <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium hover:bg-gray-50 border-2 border-gray-200 rounded-xl bg-white text-gray-900">
                                <SelectValue placeholder="Bulan" />
                              </SelectTrigger>
                              <SelectContent className="border-2 border-gray-200 rounded-xl bg-white shadow-lg">
                                {months.map((month, idx) => (
                                  <SelectItem key={idx} value={month} className="hover:bg-blue-50 focus:bg-blue-50">
                                    {month}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              onValueChange={(value) => {
                                handleYearChange(Number(value), "from");
                                setSelectedRange(null);
                              }}
                              value={yearFrom ? yearFrom.toString() : undefined}
                            >
                              <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium hover:bg-gray-50 border-2 border-gray-200 rounded-xl bg-white text-gray-900">
                                <SelectValue placeholder="Tahun" />
                              </SelectTrigger>
                              <SelectContent className="border-2 border-gray-200 rounded-xl bg-white shadow-lg">
                                {years.map((year, idx) => (
                                  <SelectItem key={idx} value={year.toString()} className="hover:bg-blue-50 focus:bg-blue-50">
                                    {year}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {numberOfMonths === 2 && (
                            <div className="flex gap-2">
                              <Select
                                onValueChange={(value) => {
                                  handleMonthChange(months.indexOf(value), "to");
                                  setSelectedRange(null);
                                }}
                                value={
                                  monthTo ? months[monthTo.getMonth()] : undefined
                                }
                              >
                                <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium hover:bg-gray-50 border-2 border-gray-200 rounded-xl bg-white text-gray-900">
                                  <SelectValue placeholder="Bulan" />
                                </SelectTrigger>
                                <SelectContent>
                                  {months.map((month, idx) => (
                                    <SelectItem key={idx} value={month}>
                                      {month}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                onValueChange={(value) => {
                                  handleYearChange(Number(value), "to");
                                  setSelectedRange(null);
                                }}
                                value={yearTo ? yearTo.toString() : undefined}
                              >
                                <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium hover:bg-gray-50 border-2 border-gray-200 rounded-xl bg-white text-gray-900">
                                  <SelectValue placeholder="Tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                  {years.map((year, idx) => (
                                    <SelectItem key={idx} value={year.toString()}>
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        <div className="flex">
                          <Calendar
                            mode="range"
                            defaultMonth={monthFrom}
                            month={monthFrom}
                            onMonthChange={setMonthFrom}
                            selected={date}
                            onSelect={handleDateSelect}
                            numberOfMonths={numberOfMonths}
                            showOutsideDays={false}
                            disabled={isDateDisabled}
                            className={className}
                          />
                        </div>
                      </div>

                      {/* Right: End Time Picker */}
                      <div className="flex flex-col gap-2 p-4 border-l-2 border-gray-200 lg:w-32">
                        <label className="text-sm font-medium text-center text-gray-700">
                          Selesai Jam:
                        </label>
                        <Select
                          value={endTime ? `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}` : ""}
                          onValueChange={(value) => {
                            const [hours, minutes] = value.split(':').map(Number);
                            const newTime = new Date();
                            newTime.setHours(hours, minutes, 0, 0);
                            onEndTimeSelect?.(newTime);
                          }}
                        >
                          <SelectTrigger className="w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-2 border-gray-200 rounded-xl bg-white text-gray-900 hover:bg-gray-50">
                            <SelectValue placeholder="23:59" />
                          </SelectTrigger>
                          <SelectContent className="border-2 border-gray-200 rounded-xl bg-white shadow-lg max-h-60">
                            {Array.from({ length: 24 * 4 }, (_, i) => {
                              const hours = Math.floor(i / 4);
                              const minutes = (i % 4) * 15;
                              const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                              return (
                                <SelectItem key={i} value={timeString} className="hover:bg-blue-50 focus:bg-blue-50">
                                  {timeString}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      {showDateSelect && (
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className="flex gap-2 ml-3">
                              <Select
                                onValueChange={(value) => {
                                  handleMonthChange(months.indexOf(value), "from");
                                  setSelectedRange(null);
                                }}
                                value={
                                  monthFrom ? months[monthFrom.getMonth()] : undefined
                                }
                              >
                                <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium hover:bg-gray-50 border-2 border-gray-200 rounded-xl bg-white text-gray-900">
                                  <SelectValue placeholder="Bulan" />
                                </SelectTrigger>
                                <SelectContent className="border-2 border-gray-200 rounded-xl bg-white shadow-lg">
                                  {months.map((month, idx) => (
                                    <SelectItem key={idx} value={month} className="hover:bg-blue-50 focus:bg-blue-50">
                                      {month}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                onValueChange={(value) => {
                                  handleYearChange(Number(value), "from");
                                  setSelectedRange(null);
                                }}
                                value={yearFrom ? yearFrom.toString() : undefined}
                              >
                                <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium hover:bg-gray-50 border-2 border-gray-200 rounded-xl bg-white text-gray-900">
                                  <SelectValue placeholder="Tahun" />
                                </SelectTrigger>
                                <SelectContent className="border-2 border-gray-200 rounded-xl bg-white shadow-lg">
                                  {years.map((year, idx) => (
                                    <SelectItem key={idx} value={year.toString()} className="hover:bg-blue-50 focus:bg-blue-50">
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {numberOfMonths === 2 && (
                              <div className="flex gap-2">
                                <Select
                                  onValueChange={(value) => {
                                    handleMonthChange(months.indexOf(value), "to");
                                    setSelectedRange(null);
                                  }}
                                  value={
                                    monthTo ? months[monthTo.getMonth()] : undefined
                                  }
                                >
                                  <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium hover:bg-gray-50 border-2 border-gray-200 rounded-xl bg-white text-gray-900">
                                    <SelectValue placeholder="Bulan" />
                                  </SelectTrigger>
                                  <SelectContent className="border-2 border-gray-200 rounded-xl bg-white shadow-lg">
                                    {months.map((month, idx) => (
                                      <SelectItem key={idx} value={month} className="hover:bg-blue-50 focus:bg-blue-50">
                                        {month}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  onValueChange={(value) => {
                                    handleYearChange(Number(value), "to");
                                    setSelectedRange(null);
                                  }}
                                  value={yearTo ? yearTo.toString() : undefined}
                                >
                                  <SelectTrigger className="hidden sm:flex w-[122px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium hover:bg-gray-50 border-2 border-gray-200 rounded-xl bg-white text-gray-900">
                                    <SelectValue placeholder="Tahun" />
                                  </SelectTrigger>
                                  <SelectContent className="border-2 border-gray-200 rounded-xl bg-white shadow-lg">
                                    {years.map((year, idx) => (
                                      <SelectItem key={idx} value={year.toString()} className="hover:bg-blue-50 focus:bg-blue-50">
                                        {year}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          <div className="flex">
                            <Calendar
                              mode="range"
                              defaultMonth={monthFrom}
                              month={monthFrom}
                              onMonthChange={setMonthFrom}
                              selected={date}
                              onSelect={handleDateSelect}
                              numberOfMonths={numberOfMonths}
                              showOutsideDays={false}
                              disabled={isDateDisabled}
                              className={className}
                            />
                          </div>
                        </div>
                      )}
                      {showTimeSelect && (
                        <div className={cn("flex flex-col gap-2", showDateSelect ? "lg:w-48 p-4 border-l-2 border-gray-200" : "p-3")}>
                          <label className="text-sm font-medium text-gray-700">
                            Waktu:
                          </label>
                          <Select
                            value={selectedTime ? `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}` : ""}
                            onValueChange={(value) => {
                              const [hours, minutes] = value.split(':').map(Number);
                              const newTime = new Date();
                              newTime.setHours(hours, minutes, 0, 0);

                              // If selected date is today, don't allow past times
                              if (date?.from) {
                                const selectedDate = new Date(date.from);
                                selectedDate.setHours(0, 0, 0, 0);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                if (selectedDate.getTime() === today.getTime()) {
                                  const now = new Date();
                                  if (newTime < now) {
                                    return; // Don't allow past times for today's events
                                  }
                                }
                              }

                              onTimeSelect?.(newTime);
                            }}
                          >
                            <SelectTrigger className="w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-2 border-gray-200 rounded-xl bg-white text-gray-900 hover:bg-gray-50">
                              <SelectValue placeholder={placeholder || "Pilih waktu"} />
                            </SelectTrigger>
                            <SelectContent className="border-2 border-gray-200 rounded-xl bg-white shadow-lg max-h-60">
                              {Array.from({ length: 24 * 4 }, (_, i) => {
                                const hours = Math.floor(i / 4);
                                const minutes = (i % 4) * 15;
                                const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                                // If selected date is today, hide past times
                                if (date?.from) {
                                  const selectedDate = new Date(date.from);
                                  selectedDate.setHours(0, 0, 0, 0);
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);

                                  if (selectedDate.getTime() === today.getTime()) {
                                    const timeDate = new Date();
                                    timeDate.setHours(hours, minutes, 0, 0);
                                    const now = new Date();
                                    if (timeDate < now) {
                                      return null; // Hide past times for today's events
                                    }
                                  }
                                }

                                return (
                                  <SelectItem key={i} value={timeString} className="hover:bg-blue-50 focus:bg-blue-50">
                                    {timeString}
                                  </SelectItem>
                                );
                              }).filter(Boolean)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </PopoverContent>
          )}
        </Popover>
      </>
    );
  }
);

CalendarDatePicker.displayName = "CalendarDatePicker";