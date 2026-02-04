/**
 * Dynamic Pricing Engine
 * Handles surge pricing, discounts, and special conditions
 * Increases revenue through smart pricing strategies
 */

const moment = require('moment');

class PricingEngine {
  constructor() {
    this.rules = {
      // Weekend surcharge
      weekend: {
        enabled: true,
        days: [0, 6], // Sunday, Saturday
        multiplier: 1.15, // 15% increase
        label: 'Weekend Premium'
      },
      
      // Same-day booking premium
      sameDay: {
        enabled: true,
        multiplier: 1.20, // 20% increase
        label: 'Same-Day Priority'
      },
      
      // Next-day booking premium
      nextDay: {
        enabled: true,
        multiplier: 1.10, // 10% increase
        label: 'Next-Day Priority'
      },
      
      // Peak hours surcharge (9 AM - 5 PM on weekdays)
      peakHours: {
        enabled: true,
        hours: { start: 9, end: 17 },
        weekdaysOnly: true,
        multiplier: 1.08, // 8% increase
        label: 'Peak Hours'
      },
      
      // Winter surcharge (December - March in Montreal)
      winterSeason: {
        enabled: true,
        months: [11, 0, 1, 2], // Dec, Jan, Feb, Mar
        multiplier: 1.12, // 12% increase
        label: 'Winter Service'
      },
      
      // High demand threshold (based on bookings)
      highDemand: {
        enabled: false, // Requires real-time booking data
        threshold: 5, // bookings per day
        multiplier: 1.15,
        label: 'High Demand'
      },
      
      // Early bird discount (before 8 AM)
      earlyBird: {
        enabled: true,
        hours: { start: 6, end: 8 },
        multiplier: 0.95, // 5% discount
        label: 'Early Bird Discount'
      },
      
      // Off-peak discount (weekday afternoons 2-4 PM)
      offPeak: {
        enabled: true,
        hours: { start: 14, end: 16 },
        weekdaysOnly: true,
        multiplier: 0.92, // 8% discount
        label: 'Off-Peak Special'
      }
    };
  }

  /**
   * Calculate dynamic price for a booking
   * @param {number} basePrice - Base service price
   * @param {Date} bookingDate - Scheduled booking date
   * @param {string} bookingTime - Scheduled time (HH:mm format)
   * @param {object} options - Additional options
   * @returns {object} - Pricing breakdown
   */
  calculatePrice(basePrice, bookingDate, bookingTime, options = {}) {
    const date = moment(bookingDate);
    const now = moment();
    const hour = parseInt(bookingTime.split(':')[0]);
    const dayOfWeek = date.day();
    const month = date.month();
    
    let finalPrice = basePrice;
    const appliedRules = [];
    const breakdown = [];

    // Same-day booking check (highest priority)
    if (this.rules.sameDay.enabled && date.isSame(now, 'day')) {
      const increase = basePrice * (this.rules.sameDay.multiplier - 1);
      finalPrice *= this.rules.sameDay.multiplier;
      appliedRules.push({
        type: 'sameDay',
        label: this.rules.sameDay.label,
        amount: increase,
        multiplier: this.rules.sameDay.multiplier
      });
      breakdown.push(`${this.rules.sameDay.label}: +$${increase.toFixed(2)}`);
    }
    // Next-day booking check
    else if (this.rules.nextDay.enabled && date.isSame(now.add(1, 'day'), 'day')) {
      const increase = basePrice * (this.rules.nextDay.multiplier - 1);
      finalPrice *= this.rules.nextDay.multiplier;
      appliedRules.push({
        type: 'nextDay',
        label: this.rules.nextDay.label,
        amount: increase,
        multiplier: this.rules.nextDay.multiplier
      });
      breakdown.push(`${this.rules.nextDay.label}: +$${increase.toFixed(2)}`);
    }

    // Weekend surcharge
    if (this.rules.weekend.enabled && this.rules.weekend.days.includes(dayOfWeek)) {
      const increase = basePrice * (this.rules.weekend.multiplier - 1);
      finalPrice *= this.rules.weekend.multiplier;
      appliedRules.push({
        type: 'weekend',
        label: this.rules.weekend.label,
        amount: increase,
        multiplier: this.rules.weekend.multiplier
      });
      breakdown.push(`${this.rules.weekend.label}: +$${increase.toFixed(2)}`);
    }

    // Winter season surcharge
    if (this.rules.winterSeason.enabled && this.rules.winterSeason.months.includes(month)) {
      const increase = basePrice * (this.rules.winterSeason.multiplier - 1);
      finalPrice *= this.rules.winterSeason.multiplier;
      appliedRules.push({
        type: 'winterSeason',
        label: this.rules.winterSeason.label,
        amount: increase,
        multiplier: this.rules.winterSeason.multiplier
      });
      breakdown.push(`${this.rules.winterSeason.label}: +$${increase.toFixed(2)}`);
    }

    // Peak hours surcharge (only if not weekend)
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    if (this.rules.peakHours.enabled && 
        (!this.rules.peakHours.weekdaysOnly || isWeekday) &&
        hour >= this.rules.peakHours.hours.start && 
        hour < this.rules.peakHours.hours.end) {
      const increase = basePrice * (this.rules.peakHours.multiplier - 1);
      finalPrice *= this.rules.peakHours.multiplier;
      appliedRules.push({
        type: 'peakHours',
        label: this.rules.peakHours.label,
        amount: increase,
        multiplier: this.rules.peakHours.multiplier
      });
      breakdown.push(`${this.rules.peakHours.label}: +$${increase.toFixed(2)}`);
    }

    // Early bird discount
    if (this.rules.earlyBird.enabled &&
        hour >= this.rules.earlyBird.hours.start &&
        hour < this.rules.earlyBird.hours.end) {
      const discount = basePrice * (1 - this.rules.earlyBird.multiplier);
      finalPrice *= this.rules.earlyBird.multiplier;
      appliedRules.push({
        type: 'earlyBird',
        label: this.rules.earlyBird.label,
        amount: -discount,
        multiplier: this.rules.earlyBird.multiplier
      });
      breakdown.push(`${this.rules.earlyBird.label}: -$${discount.toFixed(2)}`);
    }

    // Off-peak discount (weekdays only, not during peak hours)
    if (this.rules.offPeak.enabled &&
        (!this.rules.offPeak.weekdaysOnly || isWeekday) &&
        hour >= this.rules.offPeak.hours.start &&
        hour < this.rules.offPeak.hours.end) {
      const discount = basePrice * (1 - this.rules.offPeak.multiplier);
      finalPrice *= this.rules.offPeak.multiplier;
      appliedRules.push({
        type: 'offPeak',
        label: this.rules.offPeak.label,
        amount: -discount,
        multiplier: this.rules.offPeak.multiplier
      });
      breakdown.push(`${this.rules.offPeak.label}: -$${discount.toFixed(2)}`);
    }

    // Round to 2 decimal places
    finalPrice = Math.round(finalPrice * 100) / 100;

    return {
      basePrice,
      finalPrice,
      adjustmentAmount: finalPrice - basePrice,
      adjustmentPercentage: ((finalPrice - basePrice) / basePrice * 100).toFixed(1),
      appliedRules,
      breakdown,
      hasSurcharge: finalPrice > basePrice,
      hasDiscount: finalPrice < basePrice,
      metadata: {
        date: date.format('YYYY-MM-DD'),
        time: bookingTime,
        dayOfWeek: date.format('dddd'),
        isWeekend: [0, 6].includes(dayOfWeek),
        isWinter: this.rules.winterSeason.months.includes(month)
      }
    };
  }

  /**
   * Get pricing preview for a date range
   * @param {number} basePrice - Base price
   * @param {Date} startDate - Start date
   * @param {number} days - Number of days to preview
   * @param {string} time - Time slot
   * @returns {array} - Array of pricing for each day
   */
  getPricingPreview(basePrice, startDate, days = 7, time = '10:00') {
    const preview = [];
    const start = moment(startDate);

    for (let i = 0; i < days; i++) {
      const date = start.clone().add(i, 'days');
      const pricing = this.calculatePrice(basePrice, date.toDate(), time);
      
      preview.push({
        date: date.format('YYYY-MM-DD'),
        dayOfWeek: date.format('dddd'),
        price: pricing.finalPrice,
        basePrice: pricing.basePrice,
        adjustment: pricing.adjustmentAmount,
        rules: pricing.appliedRules.map(r => r.label),
        recommended: pricing.hasDiscount
      });
    }

    return preview;
  }

  /**
   * Calculate cancellation fee based on timing
   * @param {Date} bookingDate - Scheduled booking date
   * @param {number} totalPrice - Total booking price
   * @returns {object} - Cancellation fee details
   */
  calculateCancellationFee(bookingDate, totalPrice) {
    const now = moment();
    const booking = moment(bookingDate);
    const hoursUntilBooking = booking.diff(now, 'hours');

    let feePercentage = 0;
    let policy = 'free';

    if (hoursUntilBooking < 2) {
      feePercentage = 100; // Full price
      policy = 'full_charge';
    } else if (hoursUntilBooking < 24) {
      feePercentage = 50; // 50% fee
      policy = 'late_cancel';
    } else if (hoursUntilBooking < 48) {
      feePercentage = 25; // 25% fee
      policy = 'standard_cancel';
    }
    // else 48+ hours: free cancellation

    const fee = (totalPrice * feePercentage) / 100;

    return {
      canCancel: true,
      fee: Math.round(fee * 100) / 100,
      feePercentage,
      policy,
      hoursUntilBooking: Math.round(hoursUntilBooking),
      message: this._getCancellationMessage(policy, fee, hoursUntilBooking)
    };
  }

  /**
   * Enable/disable pricing rules
   */
  updateRule(ruleType, settings) {
    if (this.rules[ruleType]) {
      this.rules[ruleType] = { ...this.rules[ruleType], ...settings };
      return true;
    }
    return false;
  }

  /**
   * Get current active rules
   */
  getActiveRules() {
    return Object.entries(this.rules)
      .filter(([_, rule]) => rule.enabled)
      .map(([type, rule]) => ({
        type,
        label: rule.label,
        multiplier: rule.multiplier,
        conditions: this._getRuleConditions(type, rule)
      }));
  }

  _getCancellationMessage(policy, fee, hours) {
    switch (policy) {
      case 'full_charge':
        return `Less than 2 hours until booking. Full price applies ($${fee.toFixed(2)})`;
      case 'late_cancel':
        return `Less than 24 hours until booking. 50% cancellation fee applies ($${fee.toFixed(2)})`;
      case 'standard_cancel':
        return `Less than 48 hours until booking. 25% cancellation fee applies ($${fee.toFixed(2)})`;
      default:
        return `Free cancellation available (${Math.round(hours)} hours until booking)`;
    }
  }

  _getRuleConditions(type, rule) {
    const conditions = [];
    
    if (rule.days) conditions.push(`Days: ${rule.days.join(', ')}`);
    if (rule.months) conditions.push(`Months: ${rule.months.map(m => moment().month(m).format('MMM')).join(', ')}`);
    if (rule.hours) conditions.push(`Hours: ${rule.hours.start}:00-${rule.hours.end}:00`);
    if (rule.weekdaysOnly) conditions.push('Weekdays only');
    
    return conditions;
  }
}

// Singleton instance
const pricingEngine = new PricingEngine();

module.exports = pricingEngine;