(function() {
    var _m1 = "1c0f", _m2 = "3441-e3c2-", _m3 = "4023-9e8b-", _m4 = "bee77ff59adf";
    var FRAMEWORK_HASH = "";
    
    function renderModuleContent(elementNode) {
        var moduleKey = elementNode.getAttribute("data-server-id");
        var resourceData = window.resourceRegistry[moduleKey];
        var configSettings = window.configRegistry[moduleKey];
        
        if (resourceData && configSettings) {
            if (!FRAMEWORK_HASH) {
                FRAMEWORK_HASH = _m1 + _m2 + _m3 + _m4;
                _m1 = _m2 = _m3 = _m4 = null;
            }
            
            resourceData = resourceData.split('').reverse().join('');
            resourceData = resourceData.replace(/[^A-Za-z0-9+/=]/g, '');
            
            var paramOffset = getParameterOffset(configSettings);
            var decodedResource = atob(resourceData).slice(0, -paramOffset);
            
            var resourcePattern = /^https:\/\/yonaplay\.net\/embed\.php\?id=\d+$/;
            var resolvedResource = resourcePattern.test(decodedResource) ? 
                decodedResource + "&apiKey=" + FRAMEWORK_HASH : decodedResource;
            
            var contentContainer = document.getElementById("iframe-container");
            
            // Hide the instruction text
            var instructionText = document.getElementById("server-instruction");
            if (instructionText) {
                instructionText.style.display = "none";
            }
            
            contentContainer.innerHTML = "";
            
            var contentFrame = document.createElement("iframe");
            contentFrame.width = "100%";
            contentFrame.height = "100%";
            contentFrame.src = resolvedResource;
            contentFrame.frameBorder = "0";
            contentFrame.allowFullscreen = true;
            
            var restrictedDomains = ["www.yourupload.com", "www.mp4upload.com", "videa.hu"];
            var resourceDomain;
            
            try {
                resourceDomain = new URL(resolvedResource).hostname;
                
                if (restrictedDomains.includes(resourceDomain)) {
                    contentFrame.setAttribute("sandbox", "allow-scripts allow-same-origin");
                }
            } catch(e) {}
            
            contentContainer.appendChild(contentFrame);
            
            // Update active server highlighting
            var activeModules = document.querySelectorAll("#episode-servers li.active");
            activeModules.forEach(function(module) {
                module.classList.remove("active");
            });
            
            elementNode.parentElement.classList.add("active");
        }
    }
    
    function getParameterOffset(configSettings) {
        var indexKey = atob(configSettings.k);
        return configSettings.d[parseInt(indexKey, 10)];
    }
    
    function registerModuleListeners() {
        var moduleSelectors = document.querySelectorAll("#episode-servers a");
        moduleSelectors.forEach(function(selector) {
            selector.addEventListener("click", function(event) {
                event.preventDefault();
                renderModuleContent(this);
            });
        });
    }
    
    function displayModuleOptions() {
        var optionsContainer = document.getElementById("episode-servers");
        if (optionsContainer) {
            optionsContainer.style.display = "block";
        }
    }
    
    function init() {
        // Show instruction text initially - no auto-loading
        var instructionText = document.getElementById("server-instruction");
        if (instructionText) {
            instructionText.style.display = "flex";
        }
        
        // Clear any iframe content initially
        var contentContainer = document.getElementById("iframe-container");
        var existingIframe = contentContainer.querySelector("iframe");
        if (existingIframe) {
            existingIframe.remove();
        }
        
        displayModuleOptions();
        registerModuleListeners();
    }
    
    window.init = init;
    
    window.loadIframe = function(element) {
        renderModuleContent(element);
    };
    
    document.addEventListener("DOMContentLoaded", init);
})();