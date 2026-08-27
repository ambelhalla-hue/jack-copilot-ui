"use client"

import { useState, useEffect } from "react"
import { 
  ShieldCheck, 
  Clock, 
  PackageCheck, 
  Droplet, 
  Send, 
  CheckSquare2, 
  Square, 
  CheckCircle2, 
  FileText, 
  Wrench, 
  Trash2, 
  PlusCircle, 
  RefreshCw, 
  ShoppingBag,
  BellRing,
  X
} from "lucide-react"
import { getAllDossiers, updateDossierStatusAndData } from "@/lib/supabase"

interface PartItem {
  id: string
  designation: string
  ref: string
  quantite: number
}

interface LaborItem {
  id: string
  operation: string
  heures: number
}

export default function DashboardChefAtelier() {
  const [dossiers, setDossiers] = useState<any[]>([])
  const [selectedDossier, setSelectedDossier] = useState<any | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Gestion des pop-ups acquittées
  const [alertDevisPret, setAlertDevisPret] = useState<any | null>(null)
  const [alertClientValide, setAlertClientValide] = useState<any | null>(null)
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])

  const [mainParts, setMainParts] = useState<PartItem[]>([])
  const [peripherals, setPeripherals] = useState<PartItem[]>([])
  const [labor, setLabor] = useState<LaborItem[]>([])

  const [checkedBlocks, setCheckedBlocks] = useState({
    mainParts: false,
    peripherals: false,
    labor: false,
  })

  const [isTransmitting, setIsTransmitting] = useState(false)
  const [isTransmitted, setIsTransmitted] = useState(false)

  // Synchronisation dynamique du chiffrage avec Extracteur JSON
  useEffect(() => {
    if (selectedDossier) {
      let devis = selectedDossier.devis_ia || selectedDossier.devis_brouillon

      // Extracteur JSON : Cherche le bloc ```json généré par Jack dans le constat
      if (!devis && selectedDossier.constats_technicien) {
        const regex = /```(?:json)?\s*(\{[\s\S]*?\})\s*
