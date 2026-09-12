/**
 * Copyright 2026 Collaborative Saving Project.
 * All rights reserved.
 */

import { describe, it, expect } from 'vitest'
import {
  getDefaultInterestRate,
  getDefaultInterestPercentage,
  DEFAULT_LOAN_INTEREST_RATES,
  DEFAULT_LOAN_INTEREST_PERCENTAGES,
  LOAN_TYPE_OPTIONS,
} from '../src/features/loans/constants/loan-rates'

describe('loan-rates constants and helpers', () => {
  describe('DEFAULT_LOAN_INTEREST_RATES', () => {
    it('should map accion to 0.015 (1.5%)', () => {
      expect(DEFAULT_LOAN_INTEREST_RATES.accion).toBe(0.015)
    })

    it('should map corriente to 0.015 (1.5%)', () => {
      expect(DEFAULT_LOAN_INTEREST_RATES.corriente).toBe(0.015)
    })

    it('should map agil to 0.02 (2.0%)', () => {
      expect(DEFAULT_LOAN_INTEREST_RATES.agil).toBe(0.02)
    })

    it('should map prioritario to 0.02 (2.0%)', () => {
      expect(DEFAULT_LOAN_INTEREST_RATES.prioritario).toBe(0.02)
    })
  })

  describe('DEFAULT_LOAN_INTEREST_PERCENTAGES', () => {
    it('should map accion to 1.5%', () => {
      expect(DEFAULT_LOAN_INTEREST_PERCENTAGES.accion).toBe(1.5)
    })

    it('should map corriente to 1.5%', () => {
      expect(DEFAULT_LOAN_INTEREST_PERCENTAGES.corriente).toBe(1.5)
    })

    it('should map agil to 2.0%', () => {
      expect(DEFAULT_LOAN_INTEREST_PERCENTAGES.agil).toBe(2.0)
    })

    it('should map prioritario to 2.0%', () => {
      expect(DEFAULT_LOAN_INTEREST_PERCENTAGES.prioritario).toBe(2.0)
    })
  })

  describe('getDefaultInterestRate', () => {
    it('should return 0.015 for accion', () => {
      expect(getDefaultInterestRate('accion')).toBe(0.015)
    })

    it('should return 0.015 for corriente', () => {
      expect(getDefaultInterestRate('corriente')).toBe(0.015)
    })

    it('should return 0.02 for agil', () => {
      expect(getDefaultInterestRate('agil')).toBe(0.02)
    })

    it('should return 0.02 for prioritario', () => {
      expect(getDefaultInterestRate('prioritario')).toBe(0.02)
    })

    it('should default to 0.02 for unknown or undefined types', () => {
      expect(getDefaultInterestRate(undefined)).toBe(0.02)
      expect(getDefaultInterestRate(null)).toBe(0.02)
      expect(getDefaultInterestRate('otro')).toBe(0.02)
    })
  })

  describe('getDefaultInterestPercentage', () => {
    it('should return 1.5 for accion', () => {
      expect(getDefaultInterestPercentage('accion')).toBe(1.5)
    })

    it('should return 1.5 for corriente', () => {
      expect(getDefaultInterestPercentage('corriente')).toBe(1.5)
    })

    it('should return 2 for agil', () => {
      expect(getDefaultInterestPercentage('agil')).toBe(2)
    })

    it('should return 2 for prioritario', () => {
      expect(getDefaultInterestPercentage('prioritario')).toBe(2)
    })

    it('should default to 2 for unknown or undefined types', () => {
      expect(getDefaultInterestPercentage(undefined)).toBe(2)
      expect(getDefaultInterestPercentage(null)).toBe(2)
      expect(getDefaultInterestPercentage('otro')).toBe(2)
    })
  })

  describe('LOAN_TYPE_OPTIONS', () => {
    it('should include all 4 loan types with correct labels', () => {
      expect(LOAN_TYPE_OPTIONS).toHaveLength(4)
      expect(LOAN_TYPE_OPTIONS).toEqual([
        { value: 'corriente', label: 'Corriente (1.5%)' },
        { value: 'agil', label: 'Ágil (2%)' },
        { value: 'prioritario', label: 'Prioritario (2%)' },
        { value: 'accion', label: 'Acción (1.5%)' },
      ])
    })
  })
})
