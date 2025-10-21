import type { Database } from './database.types'

// Generic type helpers
type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]

// Tables
export type Credential = Tables<"credentials">
export type CredentialInsert = TablesInsert<"credentials">
export type CredentialUpdate = TablesUpdate<"credentials">

export type Niche = Tables<"niches">
export type NicheInsert = TablesInsert<"niches">
export type NicheUpdate = TablesUpdate<"niches">

export type Strategy = Tables<"strategies">
export type StrategyInsert = TablesInsert<"strategies">
export type StrategyUpdate = TablesUpdate<"strategies">

export type User = Tables<"users">
export type UserInsert = TablesInsert<"users">
export type UserUpdate = TablesUpdate<"users">

export type UserNiche = Tables<"users_niches">
export type UserNicheInsert = TablesInsert<"users_niches">
export type UserNicheUpdate = TablesUpdate<"users_niches">
