# Koepon Project Overview

## Purpose
Koepon (こえポン！) is a digital content gacha platform specifically designed for individual VTubers. It provides a system where VTubers can sell digital content through gacha mechanics while using the "Oshi Medal" currency system to reduce gambling aspects and ensure fan engagement through guaranteed rewards.

## Key Features
- **Gacha System**: Single-pull and 10-pull digital content purchasing
- **Oshi Medal System**: VTuber-specific currency always earned from gacha pulls
- **Exchange Shop**: Guaranteed reward exchange using Oshi Medals
- **Privilege BOX**: Management and download of acquired digital rewards
- **Legal Compliance**: Full compliance with Japan's Prize and Premiums Act and Specified Commercial Transactions Act

## Business Model
- VTubers create and manage their own gacha content
- Users purchase gacha pulls with real money
- Every gacha pull guarantees Oshi Medal rewards
- Oshi Medals can be exchanged for exclusive content
- Platform takes commission from sales

## Target Users
1. **VTubers**: Individual content creators who want to monetize digital content
2. **Fans**: Supporters who want to collect exclusive VTuber content
3. **Admins**: Platform administrators managing the ecosystem

## Tech Stack Overview
- **Backend**: NestJS + TypeScript + Supabase (PostgreSQL)
- **Frontend**: Next.js 14 + Tailwind CSS + shadcn/ui
- **Authentication**: JWT + Refresh Tokens
- **Payment**: Stripe + KOMOJU
- **File Storage**: AWS S3 / Cloudflare R2
- **Real-time**: Socket.io for gacha animations
- **Infrastructure**: Docker + Kubernetes + AWS

## Current Status
- Phase 1: Infrastructure setup (mostly complete)
- Phase 2: Backend foundation (in progress with TASK-003 Supabase setup)
- Using Supabase instead of local Docker for development
- 46 total implementation tasks planned
- Estimated 228 hours total development time