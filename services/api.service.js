// Service API pour communiquer avec le backend
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

// Fonction utilitaire pour gérer les requêtes API
const fetchWithAuth = async (endpoint, options = {}) => {
  // Récupérer le token depuis le localStorage
  const token = localStorage.getItem("token")

  // Préparer les headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  // Ajouter le token d'authentification si disponible
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Effectuer la requête
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Vérifier si la réponse est OK
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Une erreur est survenue")
  }

  return response.json()
}

// Service d'authentification
export const authService = {
  // Inscription d'un utilisateur
  register: async (userData) => {
    return fetchWithAuth("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },

  // Connexion d'un utilisateur
  login: async (credentials) => {
    const data = await fetchWithAuth("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })

    // Stocker le token dans le localStorage
    if (data.token) {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.data))
    }

    return data
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  },

  // Récupérer l'utilisateur connecté
  getCurrentUser: async () => {
    return fetchWithAuth("/auth/me")
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    return !!localStorage.getItem("token")
  },
}

// Service de gestion des objectifs
export const objectifService = {
  // Récupérer tous les objectifs
  getObjectifs: async () => {
    return fetchWithAuth("/objectifs")
  },

  // Récupérer un objectif par ID
  getObjectif: async (id) => {
    return fetchWithAuth(`/objectifs/${id}`)
  },

  // Créer un nouvel objectif
  createObjectif: async (objectif) => {
    return fetchWithAuth("/objectifs", {
      method: "POST",
      body: JSON.stringify(objectif),
    })
  },

  // Mettre à jour un objectif
  updateObjectif: async (id, objectif) => {
    return fetchWithAuth(`/objectifs/${id}`, {
      method: "PUT",
      body: JSON.stringify(objectif),
    })
  },

  // Mettre à jour la progression d'un objectif
  updateProgression: async (id, date, valeur) => {
    return fetchWithAuth(`/objectifs/${id}/progression`, {
      method: "PATCH",
      body: JSON.stringify({ date, valeur }),
    })
  },

  // Supprimer un objectif
  deleteObjectif: async (id) => {
    return fetchWithAuth(`/objectifs/${id}`, {
      method: "DELETE",
    })
  },
}

// Service d'exportation
export const exportService = {
  // Générer l'URL pour télécharger un PDF
  getPdfUrl: () => {
    const token = localStorage.getItem("token")
    return `${API_URL}/export/pdf?token=${token}`
  },

  // Générer l'URL pour télécharger un Excel
  getExcelUrl: () => {
    const token = localStorage.getItem("token")
    return `${API_URL}/export/excel?token=${token}`
  },

  // Générer l'URL pour télécharger un template
  getTemplateUrl: (categorie = "tous") => {
    const token = localStorage.getItem("token")
    return `${API_URL}/export/template?categorie=${categorie}&token=${token}`
  },

  // Télécharger un PDF
  downloadPdf: async () => {
    window.open(exportService.getPdfUrl(), "_blank")
  },

  // Télécharger un Excel
  downloadExcel: async () => {
    window.open(exportService.getExcelUrl(), "_blank")
  },

  // Télécharger un template
  downloadTemplate: async (categorie = "tous") => {
    window.open(exportService.getTemplateUrl(categorie), "_blank")
  },
}

