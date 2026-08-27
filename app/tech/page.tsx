const handleGenerateAndSendToChef = async () => {
    if (!panneConstatee.trim() || !selectedDossier) return
    setLoadingDevis(true)

    try {
      // 1. Génération de la nomenclature par l'API
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle,
          immat: plate,
          kilometrage: mileage,
          panne_constatee: panneConstatee,
          options_travaux: `Contrôles : Plaquettes AV ${quickChecks.plaquettesAV}, Disques AV ${quickChecks.disquesAV}, Plaquettes AR ${quickChecks.plaquettesAR}, Disques/Tambours AR ${quickChecks.disquesAR}, Batterie ${quickChecks.batterie}`
        })
      })

      const generatedData = await res.json()

      // 2. Mise à jour directe du statut en base
      const { updateDossierStatusAndData } = await import("@/lib/supabase")
      await updateDossierStatusAndData(selectedDossier.id, {
        statut: "devis_genere",
        constats_technicien: panneConstatee,
        devis_ia: generatedData.devis || generatedData
      })

      setDevisTransmis(true)
    } catch {
      alert("Erreur lors de la transmission au Chef d'Atelier.")
    } finally {
      setLoadingDevis(false)
    }
  }
