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

  // Mettre à jour le statut d'un objectif
  updateStatut: async (id, statut) => {
    return fetchWithAuth(`/objectifs/${id}/statut`, {
      method: "PATCH",
      body: JSON.stringify({ statut }),
    })
  },

  // Mettre à jour la progression d'un objectif
  updateProgression: async (id, date, valeur) => {
    return fetchWithAuth(`/objectifs/${id}/progression`, {
      method: "PATCH",
      body: JSON.stringify({ date, valeur }),
    })
  },

  // Ajouter ou mettre à jour un commentaire pour un objectif
  updateCommentaire: async (id, date, commentaire) => {
    return fetchWithAuth(`/objectifs/${id}/commentaire`, {
      method: "PATCH",
      body: JSON.stringify({ date, commentaire }),
    })
  },

  // Supprimer un objectif
  deleteObjectif: async (id) => {
    return fetchWithAuth(`/objectifs/${id}`, {
      method: "DELETE",
    })
  },
}

// Service de gestion des ressources
export const ressourceService = {
  // Récupérer toutes les ressources d'un objectif
  getRessources: async (objectifId) => {
    return fetchWithAuth(`/objectifs/${objectifId}/ressources`)
  },

  // Récupérer une ressource par ID
  getRessource: async (id) => {
    return fetchWithAuth(`/ressources/${id}`)
  },

  // Créer une nouvelle ressource
  createRessource: async (objectifId, ressource) => {
    return fetchWithAuth(`/objectifs/${objectifId}/ressources`, {
      method: "POST",
      body: JSON.stringify(ressource),
    })
  },

  // Mettre à jour une ressource
  updateRessource: async (id, ressource) => {
    return fetchWithAuth(`/ressources/${id}`, {
      method: "PUT",
      body: JSON.stringify(ressource),
    })
  },

  // Supprimer une ressource
  deleteRessource: async (id) => {
    return fetchWithAuth(`/ressources/${id}`, {
      method: "DELETE",
    })
  },
}

// Service de gestion du Coran
export const coranService = {
  // Récupérer les sourates du Coran
  getSourates: async () => {
    return fetchWithAuth("/coran/sourates")
  },

  // Récupérer les versets d'une sourate
  getVersets: async (sourate) => {
    return fetchWithAuth(`/coran/sourates/${sourate}`)
  },

  // Récupérer un verset spécifique
  getVerset: async (sourate, verset) => {
    return fetchWithAuth(`/coran/sourates/${sourate}/versets/${verset}`)
  },

  // Rechercher dans le Coran
  rechercherCoran: async (query) => {
    return fetchWithAuth(`/coran/recherche?q=${encodeURIComponent(query)}`)
  },
}

// Service de gestion de la culture islamique
export const cultureService = {
  // Récupérer tous les articles
  getArticles: async (categorie) => {
    const url = categorie ? `/culture?categorie=${encodeURIComponent(categorie)}` : "/culture"
    return fetchWithAuth(url)
  },

  // Récupérer un article par ID
  getArticle: async (id) => {
    return fetchWithAuth(`/culture/${id}`)
  },
}

// Service de gestion de l'IA et des conversations
export const iaService = {
  // Récupérer toutes les conversations
  getConversations: async () => {
    return fetchWithAuth("/conversations")
  },

  // Récupérer une conversation par ID 
  getConversation: async (id) => {
    return fetchWithAuth(`/conversations/${id}`)
  },

  // Créer une nouvelle conversation
  createConversation: async (objectifId) => {
    return fetchWithAuth("/conversations", {
      method: "POST",
      body: JSON.stringify({ objectifId }),
    })
  },

  // Ajouter un message à une conversation
  addMessage: async (id, message) => {
    return fetchWithAuth(`/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    })
  },

  // Supprimer une conversation
  deleteConversation: async (id) => {
    return fetchWithAuth(`/conversations/${id}`, {
      method: "DELETE",
    }) 
  },

  // Obtenir des suggestions pour un objectif
  getSuggestions: async (objectifId) => {
    return fetchWithAuth(`/objectifs/${objectifId}/suggestions`)
  },

  // Obtenir des actualités liées à un objectif
  getActualites: async (objectifId) => {
    return fetchWithAuth(`/objectifs/${objectifId}/actualites`)
  },
}

// Service de gestion des finances
export const financeService = {
  // Récupérer toutes les finances
  getFinances: async () => {
    return fetchWithAuth("/finances")
  },

  // Récupérer une finance par ID
  getFinance: async (id) => {
    return fetchWithAuth(`/finances/${id}`)
  },

  // Créer une nouvelle finance
  createFinance: async (finance) => {
    return fetchWithAuth("/finances", {
      method: "POST",
      body: JSON.stringify(finance),
    })
  },

  // Mettre à jour une finance
  updateFinance: async (id, finance) => {
    return fetchWithAuth(`/finances/${id}`, {
      method: "PUT",
      body: JSON.stringify(finance),
    })
  },

  // Supprimer une finance
  deleteFinance: async (id) => {
    return fetchWithAuth(`/finances/${id}`, {
      method: "DELETE",
    })
  },

  // Récupérer les statistiques financières
  getFinanceStats: async () => {
    return fetchWithAuth("/finances/stats")
  },

  // Récupérer les paramètres de l'utilisateur
  getParametres: async () => {
    return fetchWithAuth("/finances/parametres")
  },

  // Mettre à jour les paramètres de l'utilisateur
  updateParametres: async (parametres) => {
    return fetchWithAuth("/finances/parametres", {
      method: "PUT",
      body: JSON.stringify(parametres),
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

