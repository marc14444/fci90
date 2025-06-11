document.addEventListener("DOMContentLoaded", function () {
  const financementAutreRadio = document.querySelector(
    'input[name="financement"][value="autre"]'
  );
  const financementAutreInput = document.querySelector(
    'input[name="financement_autre"]'
  );

  financementAutreRadio.addEventListener("change", function () {
    if (this.checked) {
      financementAutreInput.classList.remove("hidden");
      financementAutreInput.disabled = false;
      financementAutreInput.required = true;
    }
  });

  document.querySelectorAll('input[name="financement"]').forEach((radio) => {
    if (radio.value !== "autre") {
      radio.addEventListener("change", function () {
        if (this.checked) {
          financementAutreInput.classList.add("hidden");
          financementAutreInput.disabled = true;
          financementAutreInput.required = false;
          financementAutreInput.value = "";
        }
      });
    }
  });

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const fileList = document.getElementById("fileList");
  const browseFiles = document.getElementById("browseFiles");

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropzone.classList.add("border-blue-500", "bg-blue-50");
  }

  function unhighlight() {
    dropzone.classList.remove("border-blue-500", "bg-blue-50");
  }

  dropzone.addEventListener("drop", handleDrop, false);

  browseFiles.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", function () {
    handleFiles(this.files);
  });

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }

  function handleFiles(files) {
    [...files].forEach(uploadFile);
  }

  let selectedFiles = [];

  function uploadFile(file) {
    if (file.size > 5 * 1024 * 1024) {
      alert(`Le fichier ${file.name} dépasse 5MB`);
      return;
    }

    selectedFiles.push(file);

    const fileItem = document.createElement("div");
    fileItem.className =
      "flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200";

    const fileInfo = document.createElement("div");
    fileInfo.className = "flex items-center";

    const fileIcon = document.createElement("i");
    fileIcon.className = "fas fa-file text-gray-500 mr-3";

    const fileName = document.createElement("span");
    fileName.className = "text-gray-700";
    fileName.textContent = file.name;

    const fileSize = document.createElement("span");
    fileSize.className = "text-sm text-gray-500 ml-2";
    fileSize.textContent = `(${(file.size / 1024 / 1024).toFixed(2)} MB)`;

    const removeBtn = document.createElement("button");
    removeBtn.className = "text-red-500 hover:text-red-700";
    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
    removeBtn.addEventListener("click", () => {
      fileItem.remove();
      selectedFiles = selectedFiles.filter((f) => f !== file);
      updateFileStatus();
    });

    fileInfo.appendChild(fileIcon);
    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileSize);
    fileItem.appendChild(fileInfo);
    fileItem.appendChild(removeBtn);
    fileList.appendChild(fileItem);

    updateFileStatus();
  }

  function updateFileStatus() {
    const files = fileList.querySelectorAll("div");
    const fileError = document.getElementById("fileError");
    fileError.classList.toggle("hidden", files.length > 0);

    let cv = false;
    let diplome = false;

    files.forEach((file) => {
      const text = file.textContent.toLowerCase();
      if (text.includes("cv")) cv = true;
      else if (text.includes("diplome") || text.includes("bac")) diplome = true;
    });

    document.getElementById("cvStatus").textContent = cv ? "Fourni" : "";
    document.getElementById("diplomeStatus").textContent = diplome
      ? "Fourni"
      : "";
    document.getElementById("autreStatus").textContent =
      !cv && !diplome && files.length > 0 ? "Fourni" : "";
  }

  const form = document.getElementById("fci90Form");
  const submitBtn = document.getElementById("submitBtn");
  const submitText = document.getElementById("submitText");
  const loadingIcon = document.getElementById("loadingIcon");
  const successPopover = document.getElementById("successPopover");
  const popoverContent = document.getElementById("popoverContent");
  const closePopover = document.getElementById("closePopover");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Vérifier qu'au moins un fichier est uploadé
    const files = fileList.querySelectorAll("div");
    if (files.length === 0) {
      document.getElementById("fileError").classList.remove("hidden");
      dropzone.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // Désactiver le bouton et afficher le loading
    submitBtn.disabled = true;
    submitText.textContent = "Envoi en cours...";
    loadingIcon.classList.remove("hidden");

    try {
      // Créer le FormData avec tous les champs du formulaire
      const formData = new FormData();

      // Ajouter tous les champs du formulaire
      formData.append("nom", document.getElementById("nom").value);
      formData.append("prenom", document.getElementById("prenom").value);
      formData.append(
        "date_naissance",
        document.getElementById("date_naissance").value
      );
      formData.append(
        "lieu_naissance",
        document.getElementById("lieu_naissance").value
      );
      formData.append(
        "nationalite",
        document.getElementById("nationalite").value
      );
      formData.append("email", document.getElementById("email").value);
      formData.append("telephone", document.getElementById("telephone").value);
      formData.append("adresse", document.getElementById("adresse").value);
      formData.append("domaine", document.getElementById("domaine").value);
      formData.append(
        "motivation",
        document.getElementById("motivation").value
      );
      formData.append("attentes", document.getElementById("attentes").value);
      formData.append("projet", document.getElementById("projet").value);

      // Gestion du financement
      const financementChecked = document.querySelector(
        'input[name="financement"]:checked'
      );
      if (financementChecked) {
        formData.append("financement", financementChecked.value);

        // Si "autre" est sélectionné, ajouter le champ texte
        if (financementChecked.value === "autre") {
          formData.append(
            "financement_autre",
            document.querySelector('input[name="financement_autre"]').value
          );
        }
      }

      // Ajouter le consentement
      formData.append(
        "consentement",
        document.getElementById("consentement").checked
      );

      // Ajouter les fichiers (nom du champ correspond à celui attendu par l'API: "fichiers")
      selectedFiles.forEach((file) => {
        formData.append("fichiers", file);
      });

      // Configuration de la requête
      const API_BASE_URL = "http://localhost:3000"; // Changez cette URL selon votre configuration

      const response = await fetch(`${API_BASE_URL}/api/candidature`, {
        method: "POST",
        body: formData,
        // Ne pas définir Content-Type, le navigateur le fera automatiquement avec boundary pour multipart/form-data
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la soumission");
      }

      // Succès - afficher le popover
      showSuccessPopover();

      // Optionnel : réinitialiser le formulaire après succès
      form.reset();
      selectedFiles = [];
      fileList.innerHTML = "";
      updateFileStatus();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);

      // Afficher un message d'erreur plus détaillé
      let errorMessage =
        "Une erreur est survenue lors de l'envoi de votre candidature.";

      if (error.message.includes("fetch")) {
        errorMessage =
          "Impossible de contacter le serveur. Vérifiez votre connexion internet.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      // Réactiver le bouton et masquer le loading
      submitBtn.disabled = false;
      submitText.textContent = "Soumettre ma candidature";
      loadingIcon.classList.add("hidden");
    }
  });

  function showSuccessPopover() {
    successPopover.classList.remove("hidden");
    setTimeout(() => {
      popoverContent.classList.remove("scale-95", "opacity-0");
      popoverContent.classList.add("scale-100", "opacity-100");
    }, 10);
  }

  function hideSuccessPopover() {
    popoverContent.classList.remove("scale-100", "opacity-100");
    popoverContent.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
      successPopover.classList.add("hidden");
    }, 200);
  }

  closePopover.addEventListener("click", hideSuccessPopover);
  successPopover.addEventListener("click", function (e) {
    if (e.target === successPopover) hideSuccessPopover();
  });
});
