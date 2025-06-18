        // console.log("Script da Calculadora Iniciado"); 
        let idx = 0;
        const IVA_RATE = 0.23; 
        const CORRECT_PASSWORD = "Mddkdsds1"; 

        const sellerSignatures = {
            "Armando Alves": "Armando Alves\n913313174\narmando.alves@mydynamic.pt",
            "Ângelo Lobo": "Ângelo Lobo\n918789192\nangelo.lobo@mydynamic.pt",
            "Carla Loução": "Carla Loução\n915832584\ngeral@mydynamic.pt",
            "Valeriya Ishchenko": "Valeriya Ishchenko\n918379037\nwww.mydynamic.pt",
            "Gonçalo Alves": "Gonçalo A.V. Alves\n912030078\ninfo.mydynamic@gmail.com"
        }; // Define sellerSignatures as an empty object

        let equipmentData = {}; // Initialize as empty object, will be populated from JSON
        const MONITOR_BASE_CHARGE_IVA_INCLUSIVE = 89;
        const MONITOR_HOURLY_EXTRA_IVA_INCLUSIVE = 19; // Updated to €19 per extra hour

        let transportationFees = {}; // Initialize as empty, will be populated from JSON
        let selectedTransportLocations = []; // Array to store selected transportation locations
        let paymentConditionsData = []; // To be populated from JSON
        let paymentMethodsData = []; // To be populated from JSON

        async function fetchEquipmentData() {
            try {
                const response = await fetch('api.php?endpoint=equipment_data&v=' + new Date().getTime());
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                equipmentData = await response.json();
                processEquipmentData(); // Process the data after fetching
                console.log("Equipment data loaded and processed successfully.");
                return true;
            } catch (error) {
                console.error("Could not load equipment data:", error);
                return false;
            }
        }

        async function fetchTransportationFees() {
            try {
                const response = await fetch('api.php?endpoint=transportation_fees&v=' + new Date().getTime());
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                transportationFees = await response.json();
                console.log("Transportation fees loaded successfully.");
                return true;
            } catch (error) {
                console.error("Could not load transportation fees:", error);
                return false;
            }
        }

        async function fetchPaymentConditions() {
            try {
                const response = await fetch('api.php?endpoint=payment_conditions&v=' + new Date().getTime());
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                paymentConditionsData = await response.json();
                console.log("Payment conditions loaded successfully.");
                return true;
            } catch (error) {
                console.error("Could not load payment conditions:", error);
                return false;
            }
        }

        async function fetchPaymentMethods() {
            try {
                const response = await fetch('api.php?endpoint=payment_methods&v=' + new Date().getTime());
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                paymentMethodsData = await response.json();
                console.log("Payment methods loaded successfully.");
                return true;
            } catch (error) {
                console.error("Could not load payment methods:", error);
                return false;
            }
        }

        function processEquipmentData() {
            for (const key in equipmentData) {
                if (equipmentData.hasOwnProperty(key)) {
                    const equipment = equipmentData[key];
                    if (equipment.image_url) {
                        // Normalize the URL: remove prefix if it exists, and decode URL components
                        let normalizedUrl = equipment.image_url.startsWith('imagens/') ? equipment.image_url.substring(8) : equipment.image_url;
                        equipment.image_url = decodeURIComponent(normalizedUrl);
                    }
                }
            }
        }

        function populateTransportLocations() {
            const selectElement = document.getElementById('transportLocationDropdown');
            if (!selectElement) {
                console.error("[populateTransportLocations] ERRO: Elemento select 'transportLocationDropdown' não encontrado.");
                return;
            }
            
            // Clear existing options
            selectElement.innerHTML = '';
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "-- Adicionar Localidade --";
            selectElement.appendChild(defaultOption);
            
            // Filter out "Nenhuma" and already selected locations
            const availableLocations = Object.keys(transportationFees)
                .filter(loc => loc !== "Nenhuma" && !selectedTransportLocations.some(selected => selected.location === loc))
                .sort();
            
            availableLocations.forEach(location => {
                const option = document.createElement('option');
                option.value = location;
                option.textContent = `${location} - €${transportationFees[location].toFixed(2)}`;
                selectElement.appendChild(option);
            });
        }

        function addTransportLocation(locationName) {
            if (!locationName || locationName === "" || transportationFees[locationName] === undefined) {
                return;
            }
            
            // Check if already added
            if (selectedTransportLocations.some(selected => selected.location === locationName)) {
                return;
            }
            
            // Add to selected list
            selectedTransportLocations.push({
                location: locationName,
                fee: transportationFees[locationName]
            });
            
            // Update displays
            renderTransportationList();
            populateTransportLocations(); // Refresh dropdown to remove selected option
            update(); // Recalculate totals
        }

        window.removeTransportLocation = function(locationName) {
            selectedTransportLocations = selectedTransportLocations.filter(selected => selected.location !== locationName);
            renderTransportationList();
            populateTransportLocations(); // Refresh dropdown to add option back
            update(); // Recalculate totals
        }

        function renderTransportationList() {
            const listContainer = document.getElementById('transportationList');
            if (!listContainer) return;
            
            listContainer.innerHTML = '';
            
            selectedTransportLocations.forEach(transport => {
                const transportItem = document.createElement('div');
                transportItem.className = 'transportation-item';
                
                transportItem.innerHTML = `
                    <div class="transportation-item-info">
                        <div class="transportation-item-name">${transport.location}</div>
                        <div class="transportation-item-price">€${transport.fee.toFixed(2)}</div>
                    </div>
                    <button type="button" class="remove-transport-btn" onclick="removeTransportLocation('${transport.location}')" title="Remover">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                
                listContainer.appendChild(transportItem);
            });
        }

        function getTotalTransportationFee() {
            return selectedTransportLocations.reduce((total, transport) => total + transport.fee, 0);
        }

        function populatePaymentConditions() {
            const container = document.getElementById('condicoesPagamentoOptions');
            if (!container) {
                console.error("Container for payment conditions not found.");
                return;
            }
            container.innerHTML = ''; // Clear existing
            paymentConditionsData.forEach(condition => {
                const label = document.createElement('label');
                label.className = 'radio-label';
                const input = document.createElement('input');
                input.type = 'radio';
                input.name = 'condPagamento';
                input.value = condition.value;
                input.id = condition.htmlId;
                if (condition.defaultChecked) {
                    input.checked = true;
                }
                input.onchange = update; // Assuming update() handles general recalculations
                label.appendChild(input);
                label.appendChild(document.createTextNode(` ${condition.label}`));
                container.appendChild(label);
            });
        }

        function populatePaymentMethods() {
            const container = document.getElementById('metodosPagamentoOptions');
            if (!container) {
                console.error("Container for payment methods not found.");
                return;
            }
            container.innerHTML = ''; // Clear existing
            paymentMethodsData.forEach(method => {
                const label = document.createElement('label');
                label.className = 'checkbox-label sub-checkbox-label';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.id = method.id;
                if (method.defaultChecked) {
                    input.checked = true;
                }
                input.onchange = update; // Assuming update() handles general recalculations
                label.appendChild(input);
                label.appendChild(document.createTextNode(` ${method.label}`));
                container.appendChild(label);
            });
        }

        function today() {
            return new Date().toISOString().substr(0, 10);
        }
        
        function handleGlobalPriceControlsChange() { 
            update();
        }
        
        function toggleItemSpecificOptions(itemIndex, showDates, showTimes) {
            const itemDatesDiv = document.getElementById(`itemDates${itemIndex}`);
            const itemTimesDiv = document.getElementById(`itemTimes${itemIndex}`);

            if (itemDatesDiv) {
                itemDatesDiv.style.display = showDates ? 'flex' : 'none';
                if (showDates) {
                    const itemFromDateInput = document.getElementById(`itemFromDate${itemIndex}`);
                    const itemToDateInput = document.getElementById(`itemToDate${itemIndex}`);
                    if (itemFromDateInput && !itemFromDateInput.value) {
                        itemFromDateInput.value = document.getElementById('fromDate').value || today();
                    }
                    if (itemToDateInput && !itemToDateInput.value) {
                        itemToDateInput.value = document.getElementById('toDate').value || today();
                    }
                }
            }
            if (itemTimesDiv) {
                itemTimesDiv.style.display = showTimes ? 'flex' : 'none';
                 if (showTimes) {
                    const itemFromTimeInput = document.getElementById(`itemFromTime${itemIndex}`);
                    const itemToTimeInput = document.getElementById(`itemToTime${itemIndex}`);
                    if (itemFromTimeInput && !itemFromTimeInput.value) {
                        itemFromTimeInput.value = document.getElementById('fromTime').value || '';
                    }
                    if (itemToTimeInput && !itemToTimeInput.value) {
                        itemToTimeInput.value = document.getElementById('toTime').value || '';
                    }
                }
            }
        }

        function updateItemDateTimeSectionVisibility(itemIndex) {
            const dateTimeTitle = document.getElementById(`dateTimeTitle${itemIndex}`);
            const itemOptionsContainer = document.getElementById(`itemOptionsContainer${itemIndex}`);

            if (!dateTimeTitle || !itemOptionsContainer) {
                return;
            }

            const globalDatesChecked = document.getElementById('globalDatesApply').checked;
            const globalTimesChecked = document.getElementById('globalTimesApply').checked;

            if (globalDatesChecked && globalTimesChecked) {
                dateTimeTitle.style.display = 'none';
                itemOptionsContainer.style.display = 'none';
            } else {
                dateTimeTitle.style.display = 'block';
                itemOptionsContainer.style.display = 'flex';
            }
        }

        function handleGlobalDatesApplyChange() {
            const showItemDates = !document.getElementById('globalDatesApply').checked;
            const showItemTimes = !document.getElementById('globalTimesApply').checked; 
            for (let i = 0; i < idx; i++) {
                toggleItemSpecificOptions(i, showItemDates, showItemTimes);
                updateItemDateTimeSectionVisibility(i);
            }
            update();
        }

        function handleGlobalTimesApplyChange() {
            const showItemDates = !document.getElementById('globalDatesApply').checked; 
            const showItemTimes = !document.getElementById('globalTimesApply').checked;
            for (let i = 0; i < idx; i++) {
                 toggleItemSpecificOptions(i, showItemDates, showItemTimes);
                 updateItemDateTimeSectionVisibility(i);
            }
            update();
        }


        function checkPredefinedPrice(itemIndex) {
            const nameInput = document.getElementById(`name${itemIndex}`);
            const priceInput = document.getElementById(`price${itemIndex}`);
            
            // console.log(`[checkPredefinedPrice] Item ${itemIndex}, Nome Inserido: '${nameInput ? nameInput.value : 'N/A'}'`);

            if (nameInput && priceInput) {
                const itemName = nameInput.value.trim();
                const enteredItemNameLower = itemName.toLowerCase();
                let foundMatch = false;

                // console.log(`   Nome Processado (lowercase, trimmed): '${enteredItemNameLower}'`);

                for (const predefinedName in equipmentData) { // Changed from predefinedPrices
                    if (equipmentData.hasOwnProperty(predefinedName)) { // Changed from predefinedPrices
                        if (predefinedName.toLowerCase() === enteredItemNameLower) {
                            const ivaInclusivePrice = equipmentData[predefinedName].price; // Changed from predefinedPrices[predefinedName]
                            priceInput.value = ivaInclusivePrice; // Directly set the IVA-inclusive price
                            priceInput.dataset.originalIvaInclusivePrice = ivaInclusivePrice; 
                            priceInput.dataset.manualOverride = 'false';
                            delete priceInput.dataset.enteredWithIvaExclusive; // Remove flag
                            // console.log(`   CORRESPONDÊNCIA ENCONTRADA: '${predefinedName}', Preço IVA Incl.: ${ivaInclusivePrice}`);
                            foundMatch = true;
                            break; 
                        }
                    }
                }
                if (!foundMatch) {
                    // priceInput.dataset.originalIvaInclusivePrice = ''; // Keep this if name is cleared and no match
                    // If no match, and it wasn't manual override before, it might become manual implicitly
                    // However, if user just clears name, price shouldn't become manual. 
                    // This part is tricky. If name is cleared, price shouldn't become manual.
                    // For now, if no match, we don't alter manualOverride or enteredWithIvaExclusive directly here.
                    // If priceInput.value is empty and dataset is empty, it will be treated as 0 price.
                    // If name is cleared, and then user types a price, oninput for price will set manual flags.
                    if (!priceInput.dataset.manualOverride || priceInput.dataset.manualOverride === 'false') {
                        priceInput.dataset.originalIvaInclusivePrice = ''; 
                        // if name is empty and we had a predefined price, clear the value
                        if (itemName === '' && priceInput.dataset.originalIvaInclusivePrice === '') priceInput.value = '';
                    }
                }
                // updateOneDisplayedItemPrice(itemIndex); // This will be removed
            } else {
                // console.error(`   ERRO: nameInput ou priceInput não encontrado para o item ${itemIndex}`);
            }
            update(); 
        }

        function updateOneDisplayedItemPrice(itemIndex) {
            const priceInput = document.getElementById(`price${itemIndex}`);
            if (!priceInput) {
                // console.error(`[updateOneDisplayedItemPrice] ERRO: PriceInput não encontrado para o item ${itemIndex}`);
                return;
            }
            
            let basePriceForCalculations;
            const originalIvaInclusivePriceFromDataset = parseFloat(priceInput.dataset.originalIvaInclusivePrice);
            const currentItemPriceFieldValue = parseFloat(priceInput.value);

            if (priceInput.dataset.manualOverride === 'true' && !isNaN(currentItemPriceFieldValue)) {
                if (document.getElementById('iva').checked) { 
                    basePriceForCalculations = currentItemPriceFieldValue * (1 + IVA_RATE); 
                } else { 
                    basePriceForCalculations = currentItemPriceFieldValue; 
                }
                // console.log(`[updateOneDisplayedItemPrice] Usando preço manual (convertido para COM IVA se necessário): ${basePriceForCalculations}`);
            } else if (!isNaN(originalIvaInclusivePriceFromDataset) && originalIvaInclusivePriceFromDataset > 0) {
                basePriceForCalculations = originalIvaInclusivePriceFromDataset;
                //  console.log(`[updateOneDisplayedItemPrice] Usando preço do dataset: ${basePriceForCalculations}`);
            } else {
                priceInput.value = '';
                // console.log(`[updateOneDisplayedItemPrice] Nenhum preço válido, campo de preço limpo.`);
                return; 
            }

            let displayPrice = basePriceForCalculations; 

            if (document.getElementById('iva').checked) { 
                displayPrice /= (1 + IVA_RATE);
            }
            if (document.getElementById('partner').checked) {
                displayPrice *= 0.85;
            }
            priceInput.value = displayPrice.toFixed(2);
            // console.log(`   Preço do campo atualizado para o item ${itemIndex}: ${priceInput.value}`);
        }


        function addItem() {
            const itemsContainer = document.getElementById('items');
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            const currentItemIdx = idx; 
            itemDiv.id = 'item' + currentItemIdx;

            const removeButton = document.createElement('button');
            removeButton.className = 'remove';
            removeButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
            removeButton.onclick = function() { removeItem(currentItemIdx); };
            itemDiv.appendChild(removeButton);

            const topRowContainer = document.createElement('div');
            topRowContainer.className = 'item-top-row';

            // Name Field
            const nameFieldContainer = document.createElement('div');
            nameFieldContainer.className = 'name-field-container';
            const nameLabel = document.createElement('label');
            nameLabel.innerHTML = 'Nome do Equipamento:';
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.id = `name${currentItemIdx}`;
            nameInput.placeholder = 'Ex: Castelo Azul';
            const suggestionsContainer = document.createElement('div');
            suggestionsContainer.className = 'autocomplete-suggestions';
            suggestionsContainer.style.display = 'none';
            
            nameInput.oninput = (event) => {
                const inputText = event.target.value.toLowerCase();
                suggestionsContainer.innerHTML = '';
                if (inputText.length < 1) {
                    suggestionsContainer.style.display = 'none';
                    const priceField = document.getElementById(`price${currentItemIdx}`);
                    if(priceField) {
                        priceField.dataset.manualOverride = 'false'; 
                        priceField.dataset.enteredWithIvaExclusive = 'false';
                    } 
                    checkPredefinedPrice(currentItemIdx);
                    return;
                }

                const filteredNames = Object.keys(equipmentData).filter(name => 
                    name.toLowerCase().startsWith(inputText)
                ).sort();

                if (filteredNames.length > 0) {
                    filteredNames.forEach(name => {
                        const suggestionItem = document.createElement('div');
                        suggestionItem.className = 'suggestion-item';
                        const index = name.toLowerCase().indexOf(inputText);
                        const part1 = name.substring(0, index);
                        const match = name.substring(index, index + inputText.length);
                        const part2 = name.substring(index + inputText.length);
                        suggestionItem.innerHTML = `${part1}<strong>${match}</strong>${part2}`;

                        suggestionItem.onclick = () => {
                            nameInput.value = name;
                            suggestionsContainer.style.display = 'none';
                            const priceField = document.getElementById(`price${currentItemIdx}`);
                            if(priceField) {
                                priceField.dataset.manualOverride = 'false'; 
                                priceField.dataset.enteredWithIvaExclusive = 'false'; 
                            } 
                            checkPredefinedPrice(currentItemIdx);
                        };
                        suggestionsContainer.appendChild(suggestionItem);
                    });
                    suggestionsContainer.style.display = 'block';
                } else {
                    suggestionsContainer.style.display = 'none';
                    const priceField = document.getElementById(`price${currentItemIdx}`);
                     if(priceField) {
                        priceField.dataset.originalIvaInclusivePrice = '';
                        if (priceField.dataset.manualOverride !== 'true') {
                            priceField.value = '';
                        }
                    }
                    checkPredefinedPrice(currentItemIdx);
                }
            };

            nameInput.onblur = () => {
                setTimeout(() => {
                    suggestionsContainer.style.display = 'none';
                }, 150); 
            };
            
            nameLabel.appendChild(nameInput);
            nameFieldContainer.appendChild(nameLabel);
            nameFieldContainer.appendChild(suggestionsContainer);
            topRowContainer.appendChild(nameFieldContainer);

            itemDiv.appendChild(topRowContainer);

            // Price Field
            const priceLabel = document.createElement('label');
            priceLabel.innerHTML = 'Preço (€):';
            const priceInput = document.createElement('input');
            priceInput.type = 'number';
            priceInput.id = `price${currentItemIdx}`;
            priceInput.placeholder = 'Ex: 100';
            priceInput.dataset.originalIvaInclusivePrice = ''; 
            priceInput.dataset.manualOverride = 'false'; 
            priceInput.oninput = () => {
                const priceInputElement = document.getElementById(`price${currentItemIdx}`);
                if(priceInputElement) {
                    priceInputElement.dataset.originalIvaInclusivePrice = ''; 
                    priceInputElement.dataset.manualOverride = 'true'; 
                    priceInputElement.dataset.enteredWithIvaExclusive = document.getElementById('iva').checked;
                }
                update(); 
            };
            priceLabel.appendChild(priceInput);
            itemDiv.appendChild(priceLabel);
            
            // Quantity and Discount Row
            const quantityDiscountRow = document.createElement('div');
            quantityDiscountRow.className = 'quantity-discount-row';
            
            // Quantity Field
            const quantityContainer = document.createElement('div');
            quantityContainer.className = 'quantity-container left-aligned';
            const quantityLabel = document.createElement('label');
            quantityLabel.innerHTML = 'Quantidade:';
            const quantityInput = document.createElement('input');
            quantityInput.type = 'number';
            quantityInput.id = `quantity${currentItemIdx}`;
            quantityInput.value = '1';
            quantityInput.min = '1';
            quantityInput.oninput = update;
            quantityLabel.appendChild(quantityInput);
            quantityContainer.appendChild(quantityLabel);
            quantityDiscountRow.appendChild(quantityContainer);

            // Discount Field
            const basePriceDiscountContainer = document.createElement('div');
            basePriceDiscountContainer.className = 'item-discount-container';
            const discountLabel = document.createElement('label');
            discountLabel.innerHTML = 'Desconto (%):'
            const discountInput = document.createElement('input');
            discountInput.type = 'number';
            discountInput.id = `discount${currentItemIdx}`; // Voltar ao ID original
            discountInput.className = 'base-price-discount';
            discountInput.setAttribute('data-item-idx', currentItemIdx);
            discountInput.value = '0';
            discountInput.min = '0';
            discountInput.max = '100';
            discountInput.oninput = update;
            discountLabel.appendChild(discountInput);
            basePriceDiscountContainer.appendChild(discountLabel);
            quantityDiscountRow.appendChild(basePriceDiscountContainer);
            
            itemDiv.appendChild(quantityDiscountRow);
            
            // Monitor row
            const monitorRow = document.createElement('div');
            monitorRow.className = 'monitor-row';
            
            // Monitor Field
            const monitorContainer = document.createElement('div');
            monitorContainer.className = 'monitor-container';
            const monLabel = document.createElement('label');
            monLabel.innerHTML = 'Monitores:';
            const monInput = document.createElement('input');
            monInput.type = 'number';
            monInput.id = `mon${currentItemIdx}`;
            monInput.value = '0';
            monInput.min = '0';
            monInput.oninput = update;
            monLabel.appendChild(monInput);
            monitorContainer.appendChild(monLabel);
            monitorRow.appendChild(monitorContainer);
            
            // Monitor Include Checkbox
            const monitorIncluidoLabel = document.createElement('label');
            monitorIncluidoLabel.className = 'checkbox-label';
            const monitorIncluidoCheckbox = document.createElement('input');
            monitorIncluidoCheckbox.type = 'checkbox';
            monitorIncluidoCheckbox.id = `monitorIncluido${currentItemIdx}`;
            monitorIncluidoCheckbox.onchange = update;
            monitorIncluidoLabel.appendChild(monitorIncluidoCheckbox);
            monitorIncluidoLabel.appendChild(document.createTextNode(' Incluído'));
            monitorRow.appendChild(monitorIncluidoLabel);
            
            itemDiv.appendChild(monitorRow);
            
            const equipTimingToggleLabel = document.createElement('label');
            equipTimingToggleLabel.className = 'checkbox-label';
            equipTimingToggleLabel.style.marginTop = '10px'; 
            const equipTimingToggleCheckbox = document.createElement('input');
            equipTimingToggleCheckbox.type = 'checkbox';
            equipTimingToggleCheckbox.id = `equipTimingToggle${currentItemIdx}`;
            equipTimingToggleCheckbox.onchange = function() {
                const equipTimingDiv = document.getElementById(`itemEquipTiming${currentItemIdx}`);
                if (equipTimingDiv) {
                    equipTimingDiv.style.display = this.checked ? 'flex' : 'none';
                }
                update();
            };
            equipTimingToggleLabel.appendChild(equipTimingToggleCheckbox);
            equipTimingToggleLabel.appendChild(document.createTextNode(' Valor por Bloco de Tempo')); 
            itemDiv.appendChild(equipTimingToggleLabel);

            const itemEquipTimingDiv = document.createElement('div');
            itemEquipTimingDiv.className = 'item-equip-timing-options'; 
            itemEquipTimingDiv.id = `itemEquipTiming${currentItemIdx}`;
            itemEquipTimingDiv.style.display = 'none'; 

            const baseHoursEquipLabel = document.createElement('label');
            baseHoursEquipLabel.innerHTML = 'Horas Base:';
            const baseHoursEquipInput = document.createElement('input');
            baseHoursEquipInput.type = 'number';
            baseHoursEquipInput.id = `baseHoursEquip${currentItemIdx}`;
            baseHoursEquipInput.value = '4'; 
            baseHoursEquipInput.min = '0';
            baseHoursEquipInput.oninput = update;
            const baseHoursGroup = document.createElement('div'); baseHoursGroup.className="field-group-inline";
            baseHoursGroup.appendChild(baseHoursEquipLabel); baseHoursGroup.appendChild(baseHoursEquipInput);
            itemEquipTimingDiv.appendChild(baseHoursGroup);

            const extraTimeBlockEquipLabel = document.createElement('label');
            extraTimeBlockEquipLabel.innerHTML = 'Bloco Extra:';
            const extraTimeBlockEquipInput = document.createElement('input');
            extraTimeBlockEquipInput.type = 'number';
            extraTimeBlockEquipInput.id = `extraTimeBlockEquip${currentItemIdx}`;
            extraTimeBlockEquipInput.value = '1'; 
            extraTimeBlockEquipInput.min = '0.5';
            extraTimeBlockEquipInput.step = '0.5';
            extraTimeBlockEquipInput.oninput = update;
            const extraTimeBlockGroup = document.createElement('div'); extraTimeBlockGroup.className="field-group-inline";
            extraTimeBlockGroup.appendChild(extraTimeBlockEquipLabel); extraTimeBlockGroup.appendChild(extraTimeBlockEquipInput);
            itemEquipTimingDiv.appendChild(extraTimeBlockGroup);

            const extraCostBlockEquipLabel = document.createElement('label');
            extraCostBlockEquipLabel.innerHTML = 'Custo Bloco:';
            const extraCostBlockEquipInput = document.createElement('input');
            extraCostBlockEquipInput.type = 'number';
            extraCostBlockEquipInput.id = `extraCostBlockEquip${currentItemIdx}`;
            extraCostBlockEquipInput.value = '19'; 
            extraCostBlockEquipInput.min = '0';
            extraCostBlockEquipInput.oninput = update;
            const extraCostBlockGroup = document.createElement('div'); extraCostBlockGroup.className="field-group-inline";
            extraCostBlockGroup.appendChild(extraCostBlockEquipLabel); extraCostBlockGroup.appendChild(extraCostBlockEquipInput);
            itemEquipTimingDiv.appendChild(extraCostBlockGroup);

            const extraCostDiscountContainer = document.createElement('div');
            extraCostDiscountContainer.className = 'item-discount-container'; 
            extraCostDiscountContainer.style.display = 'flex';
            extraCostDiscountContainer.style.alignItems = 'center';
            extraCostDiscountContainer.style.gap = '10px';
            extraCostDiscountContainer.style.marginTop = '5px';

            const extraCostDiscountToggleLabel = document.createElement('label');
            extraCostDiscountToggleLabel.className = 'checkbox-label';
            const extraCostDiscountToggleCheckbox = document.createElement('input');
            extraCostDiscountToggleCheckbox.type = 'checkbox';
            extraCostDiscountToggleCheckbox.id = `extraCostDiscountToggle${currentItemIdx}`;
            
            const extraCostDiscountPercentageInput = document.createElement('input');
            extraCostDiscountPercentageInput.type = 'number';
            extraCostDiscountPercentageInput.id = `extraCostDiscountPercentage${currentItemIdx}`;
            extraCostDiscountPercentageInput.value = '15';
            extraCostDiscountPercentageInput.min = '0';
            extraCostDiscountPercentageInput.max = '100';
            extraCostDiscountPercentageInput.style.width = '70px';
            extraCostDiscountPercentageInput.style.marginLeft = '5px';
            extraCostDiscountPercentageInput.style.display = 'none';

            extraCostDiscountToggleCheckbox.onchange = function() {
                extraCostDiscountPercentageInput.style.display = this.checked ? 'inline-block' : 'none';
                if (!this.checked) extraCostDiscountPercentageInput.value = '15';
                update();
            };
            extraCostDiscountPercentageInput.oninput = update;

            extraCostDiscountToggleLabel.appendChild(extraCostDiscountToggleCheckbox);
            extraCostDiscountToggleLabel.appendChild(document.createTextNode(' Desconto Custo Extra (%)'));
            extraCostDiscountContainer.appendChild(extraCostDiscountToggleLabel);
            extraCostDiscountContainer.appendChild(extraCostDiscountPercentageInput);
            itemEquipTimingDiv.appendChild(extraCostDiscountContainer);

            itemDiv.appendChild(itemEquipTimingDiv);

            const itemDatesDiv = document.createElement('div');
            itemDatesDiv.className = 'item-options-row';
            itemDatesDiv.id = `itemDates${currentItemIdx}`;

            const fromDateLabel = document.createElement('label');
            fromDateLabel.innerHTML = 'De:';
            const fromDateInput = document.createElement('input');
            fromDateInput.type = 'date';
            fromDateInput.id = `itemFromDate${currentItemIdx}`;
            fromDateInput.onchange = update;
            fromDateLabel.appendChild(fromDateInput);
            itemDatesDiv.appendChild(fromDateLabel);

            const toDateLabel = document.createElement('label');
            toDateLabel.innerHTML = 'Até:';
            const toDateInput = document.createElement('input');
            toDateInput.type = 'date';
            toDateInput.id = `itemToDate${currentItemIdx}`;
            toDateInput.onchange = update;
            toDateLabel.appendChild(toDateInput);
            itemDatesDiv.appendChild(toDateLabel);

            const itemTimesDiv = document.createElement('div');
            itemTimesDiv.className = 'item-options-row';
            itemTimesDiv.id = `itemTimes${currentItemIdx}`;

            const fromTimeLabel = document.createElement('label');
            fromTimeLabel.innerHTML = 'Das:';
            const fromTimeInput = document.createElement('input');
            fromTimeInput.type = 'time';
            fromTimeInput.id = `itemFromTime${currentItemIdx}`;
            fromTimeInput.onchange = update;
            fromTimeLabel.appendChild(fromTimeInput);
            itemTimesDiv.appendChild(fromTimeLabel);

            const toTimeLabel = document.createElement('label');
            toTimeLabel.innerHTML = 'Às:';
            const toTimeInput = document.createElement('input');
            toTimeInput.type = 'time';
            toTimeInput.id = `itemToTime${currentItemIdx}`;
            toTimeInput.onchange = update;
            toTimeLabel.appendChild(toTimeInput);
            itemTimesDiv.appendChild(toTimeLabel);

            const itemOptionsContainer = document.createElement('div');
            itemOptionsContainer.className = 'item-options-container';
            itemOptionsContainer.id = `itemOptionsContainer${currentItemIdx}`;

            const dateTimeTitle = document.createElement('p');
            dateTimeTitle.className = 'item-section-title';
            dateTimeTitle.textContent = 'Período e Horário do Item';
            dateTimeTitle.id = `dateTimeTitle${currentItemIdx}`;
            itemOptionsContainer.appendChild(dateTimeTitle);

            itemOptionsContainer.appendChild(itemDatesDiv);
            itemOptionsContainer.appendChild(itemTimesDiv);
            itemDiv.appendChild(itemOptionsContainer);

            const outDiv = document.createElement('div');
            outDiv.id = `out${currentItemIdx}`;
            outDiv.className = 'out';
            itemDiv.appendChild(outDiv);
            
            itemsContainer.appendChild(itemDiv);
            
            const showItemDates = !document.getElementById('globalDatesApply').checked;
            const showItemTimes = !document.getElementById('globalTimesApply').checked;
            toggleItemSpecificOptions(currentItemIdx, showItemDates, showItemTimes);
            updateItemDateTimeSectionVisibility(currentItemIdx);

            idx++;
        }

        function removeItem(itemIndex) {
            const itemElement = document.getElementById('item' + itemIndex);
            if (itemElement) itemElement.remove();
            update();
        }

        function resetApp(isLoading = false) {
            document.getElementById('items').innerHTML = '';
            idx = 0; 
            document.getElementById('clientName').value = ''; 
            document.getElementById('sellerName').value = ''; 
            document.getElementById('fromDate').value = today();
            document.getElementById('toDate').value = today();
            document.getElementById('fromTime').value = '';
            document.getElementById('toTime').value = '';
            document.getElementById('globalDatesApply').checked = true; 
            document.getElementById('globalTimesApply').checked = true;
            document.getElementById('iva').checked = false;
            // document.getElementById('partner').checked = false;
            document.getElementById('discount').value = '';
            // Clear transportation selections
            selectedTransportLocations = [];
            renderTransportationList();
            populateTransportLocations();
            document.getElementById('excludeDetailsCheckbox').checked = false;
            
            handleGlobalDatesApplyChange(); // Ensure correct display of item date fields
            handleGlobalTimesApplyChange(); // Ensure correct display of item time fields

            if (!isLoading) {
                addItem(); 
            } else {
                update(); // If loading, just update the empty summary
            }
        }

        function getDaysForItem(itemIndex) {
            const globalDatesApplyCheckbox = document.getElementById('globalDatesApply');
            let fromDateStr, toDateStr;

            if (globalDatesApplyCheckbox.checked) {
                fromDateStr = document.getElementById('fromDate').value;
                toDateStr = document.getElementById('toDate').value;
            } else {
                const itemFromDateInput = document.getElementById(`itemFromDate${itemIndex}`);
                const itemToDateInput = document.getElementById(`itemToDate${itemIndex}`);
                if (itemFromDateInput && itemToDateInput && itemFromDateInput.value && itemToDateInput.value) {
                    fromDateStr = itemFromDateInput.value;
                    toDateStr = itemToDateInput.value;
                } else { 
                    fromDateStr = document.getElementById('fromDate').value;
                    toDateStr = document.getElementById('toDate').value;
                }
            }

            if (!fromDateStr || !toDateStr) return 1; 
            const f = new Date(fromDateStr);
            const t = new Date(toDateStr);
            if (isNaN(f.getTime()) || isNaN(t.getTime())) return 1;
            const diffTime = t.getTime() - f.getTime();
            if (diffTime < 0) return 1; 
            const d = diffTime / (1000 * 60 * 60 * 24) + 1;
            return d > 0 ? Math.ceil(d) : 1; 
        }
        
        function getDurationInHours(fromTimeStr, toTimeStr) {
            if (!fromTimeStr || !toTimeStr) return 0; 
            const [fromHours, fromMinutes] = fromTimeStr.split(':').map(Number);
            const [toHours, toMinutes] = toTimeStr.split(':').map(Number);
            if (isNaN(fromHours) || isNaN(fromMinutes) || isNaN(toHours) || isNaN(toMinutes)) return 0;
            let fromTotalMinutes = fromHours * 60 + fromMinutes;
            let toTotalMinutes = toHours * 60 + toMinutes;
            if (toTotalMinutes < fromTotalMinutes) { 
                 toTotalMinutes += 24 * 60; 
            }
            const durationMinutes = toTotalMinutes - fromTotalMinutes;
            if (durationMinutes < 0) return 0; 
            return durationMinutes / 60;
        }

        function getOperationHoursForItem(itemIndex) {
            const globalTimesApplyCheckbox = document.getElementById('globalTimesApply');
            let fromTimeStr, toTimeStr;

            if (globalTimesApplyCheckbox.checked) {
                fromTimeStr = document.getElementById('fromTime').value;
                toTimeStr = document.getElementById('toTime').value;
            } else {
                const itemFromTimeInput = document.getElementById(`itemFromTime${itemIndex}`);
                const itemToTimeInput = document.getElementById(`itemToTime${itemIndex}`);
                 if (itemFromTimeInput && itemToTimeInput && itemFromTimeInput.value && itemToTimeInput.value) {
                    fromTimeStr = itemFromTimeInput.value;
                    toTimeStr = itemToTimeInput.value;
                } else { 
                    fromTimeStr = document.getElementById('fromTime').value;
                    toTimeStr = document.getElementById('toTime').value;
                }
            }
            return getDurationInHours(fromTimeStr, toTimeStr);
        }


        function update(isExport = false) {
            const showPricesWithoutIva = document.getElementById('iva').checked; 
            const globalDiscountPercent = parseFloat(document.getElementById('discount').value) || 0;

            let totalEquipBaseNet = 0; 
            let totalMonitorsBaseNet = 0;
            let totalMonitorCountDays = 0; // numMonitors * numDays acumulado
            let totalEquipExtraTimeCostNet = 0; 

            for (let i = 0; i < idx; i++) {
                const nameInput = document.getElementById('name' + i);
                if (!nameInput) continue;
                
                const priceInput = document.getElementById('price' + i);
                const quantityInput = document.getElementById('quantity' + i);
                const monInput = document.getElementById('mon' + i);
                const monitorIncluidoCheckbox = document.getElementById(`monitorIncluido${i}`);
                const outputDiv = document.getElementById('out' + i);
                const equipTimingToggleCheckbox = document.getElementById(`equipTimingToggle${i}`);
                const baseHoursEquipInput = document.getElementById(`baseHoursEquip${i}`);
                const extraTimeBlockEquipInput = document.getElementById(`extraTimeBlockEquip${i}`);
                const extraCostBlockEquipInput = document.getElementById(`extraCostBlockEquip${i}`);

                if (!priceInput || !quantityInput || !monInput || !outputDiv || !monitorIncluidoCheckbox || 
                    !baseHoursEquipInput || !extraTimeBlockEquipInput || !extraCostBlockEquipInput || !equipTimingToggleCheckbox) {
                    continue;
                }

                const numDays = getDaysForItem(i); 
                const operationHours = getOperationHoursForItem(i); 
                const quantity = parseInt(quantityInput.value) || 1;
                
                let equipmentPriceForCalcIvaInclusive;
                const enteredPrice = parseFloat(priceInput.value) || 0;

                if (priceInput.dataset.manualOverride === 'true') {
                    if (priceInput.dataset.enteredWithIvaExclusive === 'true') {
                        equipmentPriceForCalcIvaInclusive = enteredPrice * (1 + IVA_RATE);
                    } else {
                        equipmentPriceForCalcIvaInclusive = enteredPrice;
                    }
                } else {
                    const predefinedData = equipmentData[nameInput.value.trim()];
                    if (predefinedData) {
                        equipmentPriceForCalcIvaInclusive = predefinedData.price;
                    } else {
                        equipmentPriceForCalcIvaInclusive = 0;
                    }
                }
                
                // This is the equipment's own daily price for its base included hours, after its own discount.
                let equipmentDailyPriceAfterDiscountsIvaInclusive = equipmentPriceForCalcIvaInclusive;
                
                const basePriceDiscountPercentageInput = document.getElementById(`discount${i}`);
                if (basePriceDiscountPercentageInput) {
                    const discountPercentage = parseFloat(basePriceDiscountPercentageInput.value) || 0;
                    if (discountPercentage > 0) {
                        equipmentDailyPriceAfterDiscountsIvaInclusive *= (1 - (discountPercentage / 100));
                    }
                }
                
                // This is used for accumulating the total base equipment cost for global discount calculation.
                const equipmentBasePriceDailyNet = equipmentDailyPriceAfterDiscountsIvaInclusive / (1 + IVA_RATE);
                totalEquipBaseNet += equipmentBasePriceDailyNet * numDays * quantity; 

                // This is the extra cost for time, after its own discount.
                let equipmentExtraCostDailyIvaInclusive = 0;
                let equipmentExtraCostDailyNet = 0;
                if (equipTimingToggleCheckbox.checked) { 
                    const baseHoursEquip = parseFloat(baseHoursEquipInput.value) || 0;
                    const extraTimeBlockEquip = parseFloat(extraTimeBlockEquipInput.value) || 1; 
                    const extraCostBlockEquip = parseFloat(extraCostBlockEquipInput.value) || 0;
                    
                    if (operationHours > baseHoursEquip && extraTimeBlockEquip > 0) {
                        const extraHoursEquip = operationHours - baseHoursEquip;
                        const numberOfExtraBlocksEquip = Math.ceil(extraHoursEquip / extraTimeBlockEquip); 
                        let currentExtraCostBlock = extraCostBlockEquip;

                        const extraCostDiscountToggle = document.getElementById(`extraCostDiscountToggle${i}`);
                        const extraCostDiscountPercentageInput = document.getElementById(`extraCostDiscountPercentage${i}`);
                        if (extraCostDiscountToggle && extraCostDiscountToggle.checked && extraCostDiscountPercentageInput) {
                            const discountPercentage = parseFloat(extraCostDiscountPercentageInput.value) || 0;
                            currentExtraCostBlock *= (1 - (discountPercentage / 100));
                        }
                        equipmentExtraCostDailyIvaInclusive = numberOfExtraBlocksEquip * currentExtraCostBlock;
                        equipmentExtraCostDailyNet = equipmentExtraCostDailyIvaInclusive / (1 + IVA_RATE);
                        totalEquipExtraTimeCostNet += equipmentExtraCostDailyNet * numDays * quantity; 
                    }
                }
                
                let monitorBasePriceForItemNet = 0; 
                const numMonitors = parseInt(monInput.value) || 0;
                if (numMonitors > 0 && !monitorIncluidoCheckbox.checked) {
                    const monitorBaseHours = 5;
                    const extraMonitorHours = Math.max(0, operationHours - monitorBaseHours); 
                    const calculatedExtraMonitorHoursCostIvaInclusive = Math.ceil(extraMonitorHours) * MONITOR_HOURLY_EXTRA_IVA_INCLUSIVE;
                    let monitorChargeIvaInclusive = (MONITOR_BASE_CHARGE_IVA_INCLUSIVE + calculatedExtraMonitorHoursCostIvaInclusive) * numMonitors;
                    monitorBasePriceForItemNet = monitorChargeIvaInclusive / (1 + IVA_RATE);
                }
                totalMonitorsBaseNet += monitorBasePriceForItemNet * numDays; // Não multiplica pelo quantity

                if (numMonitors > 0 && !monitorIncluidoCheckbox.checked) {
                    totalMonitorCountDays += numMonitors * numDays;
                }

                // Variables for display purposes
                let equipDisplayPerItemBaseDaily, equipDisplayPerItemExtraDaily;
                let equipTotalBaseForDisplay, equipTotalExtraForDisplay;

                if (showPricesWithoutIva) {
                    // Base display uses the equipment's own price (after its discount), net of IVA.
                    equipDisplayPerItemBaseDaily = equipmentBasePriceDailyNet; 
                    // Extra display uses the extra time cost (after its discount), net of IVA.
                    equipDisplayPerItemExtraDaily = equipmentExtraCostDailyNet;
                } else {
                    // Base display uses the equipment's own price (after its discount), with IVA.
                    equipDisplayPerItemBaseDaily = equipmentDailyPriceAfterDiscountsIvaInclusive; 
                    // Extra display uses the extra time cost (after its discount), with IVA.
                    equipDisplayPerItemExtraDaily = equipmentExtraCostDailyIvaInclusive;
                }

                equipTotalBaseForDisplay = equipDisplayPerItemBaseDaily * numDays * quantity;
                equipTotalExtraForDisplay = equipDisplayPerItemExtraDaily * numDays * quantity;

                let monitorDisplayPerItemDaily = showPricesWithoutIva ? monitorBasePriceForItemNet : monitorBasePriceForItemNet * (1 + IVA_RATE);
                
                const equipDisplayTotalForItem = equipTotalBaseForDisplay + equipTotalExtraForDisplay;
                const monitorDisplayTotalForItem = monitorDisplayPerItemDaily * numDays; // Não multiplica pelo quantity
                const totalItemDisplay = equipDisplayTotalForItem + monitorDisplayTotalForItem;

                let itemDetails = `Equip.: €${equipDisplayTotalForItem.toFixed(2)}`;
                itemDetails += ` (€${equipTotalBaseForDisplay.toFixed(2)} Base`;
                const basePriceDiscountElement = document.getElementById(`discount${i}`);
                const discountPercentage = basePriceDiscountElement ? (parseFloat(basePriceDiscountElement.value) || 0) : 0;
                if (discountPercentage > 0) {
                    itemDetails += ` [-${discountPercentage.toFixed(0)}%]`;
                }
                if (equipTimingToggleCheckbox.checked && equipmentExtraCostDailyIvaInclusive > 0) {
                     itemDetails += ` + €${equipTotalExtraForDisplay.toFixed(2)} Extra`;
                     const extraCostDiscountToggle = document.getElementById(`extraCostDiscountToggle${i}`);
                     const extraCostDiscountPercentageInput = document.getElementById(`extraCostDiscountPercentage${i}`);
                     if (extraCostDiscountToggle && extraCostDiscountToggle.checked && extraCostDiscountPercentageInput && parseFloat(extraCostDiscountPercentageInput.value) > 0) {
                        itemDetails += ` [-${parseFloat(extraCostDiscountPercentageInput.value).toFixed(0)}%]`;
                     }
                }
                itemDetails += `)`; 

                itemDetails += ` (${quantity > 1 ? quantity + 'x ' : ''}${numDays} dia(s)`;
                if (operationHours > 0) itemDetails += `, ${operationHours.toFixed(1)}h/dia`;
                itemDetails += `)\n`;
                
                if (numMonitors > 0) {
                    const unitPerMonitor = monitorDisplayPerItemDaily / numMonitors; // custo por monitor por dia
                    itemDetails += `Mon.: ${numMonitors} (€${monitorDisplayTotalForItem.toFixed(2)} (${unitPerMonitor.toFixed(2)}€/und.)`;
                    if (operationHours > 0) itemDetails += `, ${operationHours.toFixed(1)}h`;
                    if (monitorIncluidoCheckbox.checked) itemDetails += ", Incluído";
                    itemDetails += `)\n`;
                } else if (monitorIncluidoCheckbox.checked) { 
                     itemDetails += `Mon.: Incluído\n`;
                }

                itemDetails += `Total Item: €${totalItemDisplay.toFixed(2)}`;
                outputDiv.innerText = itemDetails;
            }

            const subTotalEquipMonitorsBaseNet = totalEquipBaseNet + totalMonitorsBaseNet; // This is just a sum before further specific breakdowns for summary display
            const transportFeeIvaInclusive = getTotalTransportationFee();
            const transportFeeBase = transportFeeIvaInclusive / (1 + IVA_RATE); 
            
            const subTotalBeforeGlobalDiscountBaseNet = totalEquipBaseNet; // Global discount applies ONLY to this base equipment sum
            const globalDiscountAmount = (subTotalBeforeGlobalDiscountBaseNet * (globalDiscountPercent / 100)); 
            const totalEquipBaseAfterGlobalDiscountNet = subTotalBeforeGlobalDiscountBaseNet - globalDiscountAmount;

            // Final total sums the discounted base equipment, plus non-discounted extra time, monitors, and transport
            const finalTotalBaseNet = totalEquipBaseAfterGlobalDiscountNet + totalEquipExtraTimeCostNet + totalMonitorsBaseNet + transportFeeBase; 
            
            const summaryElement = document.getElementById('summary');
            summaryElement.innerHTML = ''; 

            function appendSummaryLine(label, value, className = "") {
                const p = document.createElement("p");
                if (className) p.className = className;
                const formattedValue = typeof value === 'number' ? `€${value.toFixed(2)}` : value;
                p.innerHTML = `${label} <span>${formattedValue}</span>`;
                document.getElementById("summary").appendChild(p);
            }

            if (showPricesWithoutIva) {
                const equipEAnimacoesNet = totalEquipBaseNet + totalEquipExtraTimeCostNet;
                appendSummaryLine('Equipamentos e Animações', equipEAnimacoesNet);
                appendSummaryLine('Monitores', totalMonitorsBaseNet);
                if (selectedTransportLocations.length > 0) {
                    selectedTransportLocations.forEach(transport => {
                        const transportFeeNet = transport.fee / (1 + IVA_RATE);
                        appendSummaryLine(`Transporte (${transport.location})`, transportFeeNet);
                    });
                }
                if (globalDiscountPercent > 0) {
                    const subtotalForDiscount = totalEquipBaseNet;
                    appendSummaryLine('SUBTOTAL (base p/ desc.):', subtotalForDiscount);
                    appendSummaryLine(`Desconto sobre o valor dos Equipamentos (${globalDiscountPercent.toFixed(1)}%)`, -globalDiscountAmount, 'discount-line');
                }
                appendSummaryLine('VALOR FINAL (s/IVA)', finalTotalBaseNet, 'grand-total');
            } else { 
                const equipEAnimacoesComIva = (totalEquipBaseNet + totalEquipExtraTimeCostNet) * (1 + IVA_RATE);
                appendSummaryLine('Equipamentos e Animações', equipEAnimacoesComIva);
                appendSummaryLine('Monitores', totalMonitorsBaseNet * (1 + IVA_RATE));
                if (selectedTransportLocations.length > 0) {
                    selectedTransportLocations.forEach(transport => {
                        appendSummaryLine(`Transporte (${transport.location})`, transport.fee);
                    });
                }
                 if (globalDiscountPercent > 0) {
                    const subtotalForDiscount = totalEquipBaseNet * (1 + IVA_RATE);
                    appendSummaryLine('SUBTOTAL (base p/ desc.):', subtotalForDiscount);
                    appendSummaryLine(`Desconto sobre o valor dos Equipamentos (${globalDiscountPercent.toFixed(1)}%)`, -(globalDiscountAmount * (1 + IVA_RATE)), 'discount-line');
                }
                appendSummaryLine('VALOR FINAL (c/IVA)', finalTotalBaseNet * (1 + IVA_RATE), 'grand-total');
            }
        }

        async function buildQuoteHtml(quoteData = null) {
            console.log("[buildQuoteHtml] Building quote HTML...");
            console.log("[buildQuoteHtml] Received quoteData:", quoteData);

            // Use passed in quote data if available, otherwise use current form state
            const showPricesWithoutIva = quoteData ? quoteData.iva : document.getElementById('iva').checked;
            const globalDiscountPercent = quoteData ? parseFloat(quoteData.discount) || 0 : parseFloat(document.getElementById('discount').value) || 0;
            const selectedTransportLocationsForExport = quoteData ? (quoteData.selectedTransportLocations || []) : selectedTransportLocations;
            const transportFeeIvaInclusive = selectedTransportLocationsForExport.reduce((total, transport) => total + transport.fee, 0);
            const globalDatesApplied = quoteData ? quoteData.globalDatesApply : document.getElementById('globalDatesApply').checked;
            const globalTimesApplied = quoteData ? quoteData.globalTimesApply : document.getElementById('globalTimesApply').checked;
            const clientName = quoteData ? quoteData.clientName : document.getElementById('clientName').value.trim();
            const fromDateGlobal = quoteData ? quoteData.fromDate : document.getElementById('fromDate').value;
            const toDateGlobal = quoteData ? quoteData.toDate : document.getElementById('toDate').value;
            const fromTimeGlobalVal = quoteData ? quoteData.fromTime : document.getElementById('fromTime').value;
            const toTimeGlobalVal = quoteData ? quoteData.toTime : document.getElementById('toTime').value;
            const excludeDetails = quoteData ? false : document.getElementById('excludeDetailsCheckbox').checked;
            const sellerName = quoteData ? quoteData.sellerName : document.getElementById('sellerName').value.trim();

            const includeCondPagamento = quoteData ? quoteData.includeCondPagamentoExport : document.getElementById('includeCondPagamentoExport').checked;
            const includeMetPagamento = quoteData ? quoteData.includeMetPagamentoExport : document.getElementById('includeMetPagamentoExport').checked;
            let condPagamentoSelecionada = '';
            if (includeCondPagamento) {
                if (quoteData && quoteData.condPagamento) {
                    const conditionData = paymentConditionsData.find(c => c.value === quoteData.condPagamento);
                    if (conditionData) {
                        condPagamentoSelecionada = conditionData.exportText || conditionData.label;
                    }
                } else {
                    const condPagRadios = document.getElementsByName('condPagamento');
                    for (const radio of condPagRadios) {
                        if (radio.checked) {
                            const conditionData = paymentConditionsData.find(c => c.value === radio.value);
                            if (conditionData) {
                                condPagamentoSelecionada = conditionData.exportText || conditionData.label;
                            }
                            break;
                        }
                    }
                }
            }

            const metodosPagamentoSelecionados = [];
            if (includeMetPagamento) {
                if (quoteData) {
                    // Check payment methods from saved data
                    if (quoteData.metPagDinheiro) {
                        const dinheiro = paymentMethodsData.find(m => m.id === 'metPagDinheiro');
                        if (dinheiro) metodosPagamentoSelecionados.push(dinheiro.exportText || dinheiro.label);
                    }
                    if (quoteData.metPagMbway) {
                        const mbway = paymentMethodsData.find(m => m.id === 'metPagMbway');
                        if (mbway) metodosPagamentoSelecionados.push(mbway.exportText || mbway.label);
                    }
                    if (quoteData.metPagCheque) {
                        const cheque = paymentMethodsData.find(m => m.id === 'metPagCheque');
                        if (cheque) metodosPagamentoSelecionados.push(cheque.exportText || cheque.label);
                    }
                    if (quoteData.metPagTransf) {
                        const transf = paymentMethodsData.find(m => m.id === 'metPagTransf');
                        if (transf) metodosPagamentoSelecionados.push(transf.exportText || transf.label);
                    }
                } else {
                    // Get payment methods from form
                    paymentMethodsData.forEach(method => {
                        const checkbox = document.getElementById(method.id);
                        if (checkbox && checkbox.checked) {
                            metodosPagamentoSelecionados.push(method.exportText || method.label);
                        }
                    });
                }
            }

            let htmlContent = `
                     <style>
* { box-sizing: border-box; }
body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333; font-size: 10pt; line-height: 1.4; } 
.export-container {
width: 210mm;
max-width: 210mm;
margin: 15mm auto; 
padding: 15mm;
background-color: #fff;
}
.export-logo { max-height: 140px; margin-bottom: 8mm; display: block; margin-left: auto; margin-right: auto;}
.header { text-align: center; padding-bottom: 8mm; border-bottom: 1px solid #ccc; margin-bottom: 8mm; }
.header h1 { margin: 0 0 4px 0; font-size: 20pt; color: #333 !important; font-weight: bold; } 
.header .client-info { font-size: 11pt; color: #555; margin-top: 3px; text-align:center;}
.header .date-info { font-size: 11pt; color: #555; margin-top: 2px; text-align:center;}
.quote-details { margin-bottom: 8mm; padding-bottom: 4mm; border-bottom: 1px dashed #eee;}
.quote-details p { margin: 3px 0; font-size: 9pt; } 
.quote-details strong { font-weight: bold; }
.equipment-catalog-section { } 
.equipment-detail-item-wrapper { margin-bottom: 10mm; }
.equipment-detail-item { display: flex; flex-direction: row; align-items: flex-start; gap: 8mm; padding: 6mm 0; border-bottom: 1px dotted #e0e0e0; }
.equipment-detail-item:last-child { border-bottom: none; }
.equipment-detail-image-column { flex: 0 0 85mm; text-align: center; margin-top: 3mm; }
.equipment-detail-image-column img { max-width: 100%; max-height: 120mm; height: auto; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); object-fit: contain;}
.equipment-detail-info-column { flex: 1; text-align: left; padding-left: 3mm; }
.equipment-detail-info-column h2 { font-size: 15pt; color: #2c3e50; margin-top: 0; margin-bottom: 3mm; padding-bottom: 1.5mm; border-bottom: 1px solid #3498db; }
.equipment-detail-info-column .description { font-size: 9.5pt; color: #34495e; white-space: pre-line; line-height: 1.5;}
.summary-table-wrapper { padding-top:10mm;} 
table { width: 100%; table-layout: fixed; margin-bottom: 15px; margin-top: 5mm; table-layout: fixed; }
th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; font-size: 10pt; vertical-align: top; }
th { background-color: #f0f0f0; color: #333; font-weight: bold; text-transform: uppercase; font-size: 8.5pt; text-align: center; white-space: nowrap; } 
tr:nth-child(even) td { background-color: #f9f9f9; }
td small { font-size: 0.85em; color: #555; display: block; margin-top: 1px;}
.summary-section { margin-top: 15px; padding: 12px 15px; background-color: #f9f9f9; border: 1px solid #eee; border-radius: 3px; }
.summary-section p { margin: 5px 0; font-size: 0.95em; } 
.summary-section strong { font-weight: bold; }
.summary-section .discount-line { font-size: 0.95em; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #d0d0d0;}
p.grand-total-final { font-size: 1em !important; font-weight: bold !important; color: #333 !important; margin-top: 7px !important; padding-top: 7px !important; border-top: 1px solid #aaa !important;}
p.grand-total-final strong { color: #333 !important; font-weight: bold !important; }
.footer { text-align: center; margin-top: 40px; padding: 20px 0; border-top: 2px solid #007bff; font-size: 1em; color: #555; page-break-inside: avoid !important; } 
.footer p { margin: 5px 0; font-size: 1.2em; }
.page-footer { margin-top: 40px !important; padding: 20px 0 !important; border-top: 2px solid #007bff !important; page-break-inside: avoid !important; }
.page-footer p { color: #333 !important; margin: 5px 0 !important; }
.page-footer p:first-child { color: #333 !important; font-weight: bold !important; font-size: 1.4em !important; }
.page-footer p:last-child { font-size: 1.2em !important; }
.seller-signature { margin-top: 10mm; padding-top: 5mm; border-top: 1px solid #ccc; font-size: 9pt; color: #555; white-space: pre-line; text-align: center; }
.item-notes { font-size: 0.9em; color: #555; margin-top: 10px; font-style: italic; } 
.general-conditions-section { margin-top: 15mm; padding-top: 5mm; border-top: 1px solid #ccc; font-size: 9pt; }
.general-conditions-section h3 { font-size: 11pt; color: #333; margin-bottom: 3mm; }
.general-conditions-section p, .general-conditions-section ul { margin-bottom: 2mm; line-height: 1.4; }
.general-conditions-section ul { padding-left: 5mm; list-style-type: disc; }
.general-conditions-section ul li { margin-bottom: 1mm; }

@media print { 
html, body {
    font-size: 10pt; 
    -webkit-print-color-adjust: exact; 
    print-color-adjust: exact;
    margin: 0; 
    padding: 0;
    height: auto !important;
    overflow: visible !important;
} 
.export-container { 
    box-shadow: none; 
    border: none;
    width: 210mm;
    margin: 15mm auto; 
    padding: 15mm; 
    background-color: #fff !important; 
    max-width: none; 
    height: auto !important;
    overflow: visible !important;
    page-break-inside: avoid !important;
}
.equipment-catalog-section { 
    page-break-after: auto; 
    page-break-inside: avoid !important;
} 
.equipment-detail-item-wrapper {
    page-break-after: auto !important; 
    page-break-inside: avoid !important; 
    margin-bottom: 10mm; 
}
.equipment-detail-item-wrapper:last-of-type {
    page-break-after: auto;
}
.equipment-detail-item {
    border-bottom: 1px dotted #eee; 
}
.equipment-detail-image-column img {
    max-width: 100%;
    max-height: 130mm;
}
.equipment-detail-info-column h2 {
        font-size: 13pt;
}
.equipment-detail-info-column .description {
    font-size: 9pt;
}
.summary-table-wrapper { 
    page-break-before: auto !important; 
}
table { font-size: 7pt; table-layout: fixed; width: 95% !important; margin: 0 auto !important; }
th, td { padding: 5px 8px; white-space: nowrap; overflow: hidden; }
th { text-align: center; white-space: nowrap; }
.summary-section { font-size: 0.9em; page-break-inside: avoid !important; }
.summary-section .grand-total-final { font-size: 0.95em; color: #333 !important; }
.summary-section .grand-total-final strong { color: #333 !important; } 
.page-footer { margin-top: 15mm !important; padding: 5mm 0 !important; border-top: 1pt solid #007bff !important; page-break-inside: avoid !important; text-align: center !important; }
.page-footer p { color: #333 !important; margin: 2mm 0 !important; }
.page-footer p:first-child { color: #333 !important; font-weight: bold !important; font-size: 12pt !important; }
.page-footer p:last-child { font-size: 10pt !important; }
.no-print { display: none !important; } 
}

.item-top-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    align-items: flex-end;
    margin-bottom: var(--spacing-md);
}

.name-field-container {
    flex: 1 1 250px; /* Grow, shrink, and base width */
}

.quantity-container,
.item-discount-container {
    flex-shrink: 0;
}

.quantity-container label,
.item-discount-container label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.9rem;
    font-weight: 600;
}

.quantity-container input,
.item-discount-container input {
    width: 80px;
}
</style>`;
            htmlContent += `<div class="export-container">`;

            htmlContent += `<div class="header" style="text-align: center; margin-bottom: 20px;"><img src="imagens/logo.png" alt="My Dynamic Logo" class="export-logo" onerror="this.style.display='none';" style="max-height: 140px; margin-bottom: 15px;"><h1 style="margin: 10px 0; font-size: 24pt;">Orçamento de Animação</h1>`;
            
            // Always show client name if it exists
            if (clientName) {
                htmlContent += `<p class="client-info" style="font-size: 16pt; margin: 10px 0; color: #333;">${clientName}</p>`;
            }
            
            // Show dates in a cleaner format
            if (globalDatesApplied && fromDateGlobal && toDateGlobal) {
                if (fromDateGlobal === toDateGlobal) {
                    // Same day - show just the date
                    htmlContent += `<p class="date-info" style="font-size: 14pt; margin: 5px 0; color: #666;">${fromDateGlobal}</p>`;
                } else {
                    // Different days - show range without "Datas:" prefix
                    htmlContent += `<p class="date-info" style="font-size: 14pt; margin: 5px 0; color: #666;">De ${fromDateGlobal} até ${toDateGlobal}</p>`;
                }
            }
            htmlContent += `</div>`;

            htmlContent += `<div class="quote-details" style="text-align: center; margin-bottom: 20px;">`;
            if (globalTimesApplied && (fromTimeGlobalVal || toTimeGlobalVal)) {
                htmlContent += `<p style="margin: 5px 0;"><strong>Horário:</strong> Das ${fromTimeGlobalVal || "N/A"} às ${toTimeGlobalVal || "N/A"}</p>`;
            }
            if (selectedTransportLocationsForExport.length > 0) {
                const locationsList = selectedTransportLocationsForExport.map(transport => transport.location).join(', ');
                htmlContent += `<p style="margin: 5px 0;"><strong>Localidades:</strong> ${locationsList}</p>`;
            }
            htmlContent += `</div>`;

            if (!excludeDetails) {
                htmlContent += `<div class="equipment-catalog-section">`;
                
                let itemsToProcess;
                if (quoteData) {
                    // Use saved quote data
                    itemsToProcess = quoteData.items || [];
                } else {
                    // Use current form data
                    itemsToProcess = Array.from({length: idx}, (_, i) => {
                        const nameInput = document.getElementById('name' + i);
                        if (!nameInput) return null;
                        
                        const itemName = nameInput.value.trim();
                        const equipmentDetails = equipmentData[itemName] || {};
                        
                        return {
                            name: itemName,
                            equipmentDetails: {
                                image_url: equipmentDetails.image_url || null,
                                description: equipmentDetails.description || ''
                            }
                        };
                    }).filter(item => item && item.name);
                }
                
                for (let i = 0; i < itemsToProcess.length; i++) {
                    const item = itemsToProcess[i];
                    const itemName = item.name;
                    const details = item.equipmentDetails || {};
                    
                    if (details) {
                        htmlContent += `<div class="equipment-detail-item-wrapper">`;
                        htmlContent += `<div class="equipment-detail-item">`;
                        htmlContent += `<div class="equipment-detail-image-column">`;
                        const imageUrl = details.image_url ? `imagens/${details.image_url}` : `imagens/logo-orca.png`;
                        htmlContent += `<img src="${imageUrl}" alt="Imagem de ${itemName}" onerror="this.src='imagens/logo-orca.png';">`;
                        
                        htmlContent += `</div>`;
                        htmlContent += `<div class="equipment-detail-info-column">`;
                        htmlContent += `<h2>${itemName}</h2>`;
                        let descriptionText = details.description ? details.description.replace(/\\n/g, '<br>') : '';
                        htmlContent += `<div class="description">${descriptionText}</div>`;
                        htmlContent += `</div>`;
                        htmlContent += `</div>`;
                        htmlContent += `</div>`;
                    }
                }
                htmlContent += `</div>`;
            }

            htmlContent += `<div class="summary-table-wrapper">`;
            htmlContent += `<div style="text-align: center; width: 100%;"><table style="width: 100%; table-layout: fixed; margin: 0; border-collapse: collapse;"><thead><tr>
                <th style="width: 25%; white-space: nowrap;">Equipamento</th>
                <th style="width: 15%; white-space: nowrap;">Valor uni.</th>
                <th style="width: 8%;  white-space: nowrap;">Qtd.</th>
                <th style="width: 8%;  white-space: nowrap;">Dias</th>
                ${!globalDatesApplied ? '<th style="width: 14%; white-space: nowrap;">Período Item</th>' : ''}
                ${!globalTimesApplied ? '<th style="width: 14%; white-space: nowrap;">Horário Item</th>' : ''}
                <th style="width: 10%; white-space: nowrap;">Monit.</th>
                <th style="width: 10%; white-space: nowrap;">Horas</th>
                <th style="width: 19%; white-space: nowrap;">Total Equip.</th>
                <th style="width: 19%; white-space: nowrap;">Total Monit.</th>
                <th style="width: 19%; white-space: nowrap;">Total</th>
            </tr></thead><tbody>`;

            let overallTotalEquipBaseNetExport = 0;
            let overallTotalMonitorsBaseNetExport = 0;
            let overallTotalEquipExtraTimeCostNetExport = 0;
            let overallMonitorCountDays = 0;

            // Determine the items to process for the table
            let tableItemsToProcess;
            if (quoteData) {
                // Use saved quote data
                tableItemsToProcess = quoteData.items || [];
            } else {
                // Use current form data
                tableItemsToProcess = [];
                for (let i = 0; i < idx; i++) {
                    const nameInput = document.getElementById('name' + i);
                    if (!nameInput || !nameInput.value.trim()) continue;
                    
                    const itemName = nameInput.value.trim();
                    const priceInput = document.getElementById('price' + i);
                    const monInput = document.getElementById('mon' + i);
                    const quantityInput = document.getElementById(`quantity${i}`);
                    
                    tableItemsToProcess.push({
                        name: itemName,
                        price: priceInput.value,
                        monitors: monInput.value,
                        quantity: quantityInput?.value || 1,
                        // Include all the form data we need
                        itemIndex: i
                    });
                }
            }

            for (let i = 0; i < tableItemsToProcess.length; i++) {
                const item = tableItemsToProcess[i];
                let itemName, priceValue, monValue, quantity;
                let numDaysForItem, operationHours;
                let itemPeriodText = '';
                let itemTimeText = '';
                
                if (quoteData) {
                    // Using saved quote data
                    itemName = item.name || "N/A";
                    priceValue = parseFloat(item.price) || 0;
                    monValue = parseInt(item.monitors) || 0;
                    quantity = parseInt(item.quantity) || 1;
                    
                    // Determine the relevant dates/times for this item taking into account
                    // whether the quote uses global or individual settings.
                    const fromDateRelevant = globalDatesApplied
                        ? quoteData.fromDate
                        : (item.itemFromDate || quoteData.fromDate);
                    const toDateRelevant   = globalDatesApplied
                        ? quoteData.toDate
                        : (item.itemToDate   || quoteData.toDate);
                    numDaysForItem = calcDaysBetween(fromDateRelevant, toDateRelevant);

                    const fromTimeRelevant = globalTimesApplied
                        ? quoteData.fromTime
                        : (item.itemFromTime || quoteData.fromTime);
                    const toTimeRelevant   = globalTimesApplied
                        ? quoteData.toTime
                        : (item.itemToTime   || quoteData.toTime);
                    operationHours = calcHoursBetween(fromTimeRelevant, toTimeRelevant);
                    
                    // Only include the per-item period/time columns when global values are not applied
                    if (!globalDatesApplied) {
                        itemPeriodText = `<td>De ${fromDateRelevant || 'N/A'}<br>Até ${toDateRelevant || 'N/A'}</td>`;
                    }
                    if (!globalTimesApplied) {
                        itemTimeText = `<td>${fromTimeRelevant || 'N/A'} - ${toTimeRelevant || 'N/A'}</td>`;
                    }
                } else {
                    // Using current form data
                    const itemIndex = item.itemIndex;
                    const nameInput = document.getElementById('name' + itemIndex);
                    const priceInput = document.getElementById('price' + itemIndex);
                    const monInput = document.getElementById('mon' + itemIndex);
                    const quantityInputDom = document.getElementById(`quantity${itemIndex}`);
                    
                    itemName = nameInput.value.trim() || "N/A";
                    priceValue = parseFloat(priceInput.value) || 0;
                    monValue = parseInt(monInput.value) || 0;
                    quantity = parseInt(quantityInputDom?.value) || 1;
                    
                    numDaysForItem = getDaysForItem(itemIndex);
                    operationHours = getOperationHoursForItem(itemIndex);
                    
                    if (!globalDatesApplied) {
                        const itemFromDateVal = document.getElementById(`itemFromDate${itemIndex}`)?.value || 'N/A';
                        const itemToDateVal = document.getElementById(`itemToDate${itemIndex}`)?.value || 'N/A';
                        itemPeriodText = `<td>De ${itemFromDateVal}<br>Até ${itemToDateVal}</td>`;
                    }
                    if (!globalTimesApplied) {
                        const itemFromTimeVal = document.getElementById(`itemFromTime${itemIndex}`)?.value || 'N/A';
                        const itemToTimeVal = document.getElementById(`itemToTime${itemIndex}`)?.value || 'N/A';
                        itemTimeText = `<td>${itemFromTimeVal} - ${itemToTimeVal}</td>`;
                    }
                }

                // Check for monitor included setting
                const monitorIncluido = quoteData ? (item.monitorIncluido || false) : 
                    (document.getElementById(`monitorIncluido${item.itemIndex || i}`)?.checked || false);

                let equipmentOriginalDailyPriceIvaInclusive;
                const enteredPriceExport = priceValue;
                
                // Check if it's a manual override (for current form) or use saved data
                const isManualOverride = quoteData ? (item.manualOverride || false) : 
                    (document.getElementById(`price${item.itemIndex || i}`)?.dataset.manualOverride === 'true');
                
                if (isManualOverride) {
                    const enteredWithIvaExclusive = quoteData ? (item.enteredWithIvaExclusive || false) :
                        (document.getElementById(`price${item.itemIndex || i}`)?.dataset.enteredWithIvaExclusive === 'true');
                    
                    if (enteredWithIvaExclusive) {
                        equipmentOriginalDailyPriceIvaInclusive = enteredPriceExport * (1 + IVA_RATE);
                    } else {
                        equipmentOriginalDailyPriceIvaInclusive = enteredPriceExport;
                    }
                } else {
                    const predefinedData = equipmentData[itemName];
                    equipmentOriginalDailyPriceIvaInclusive = predefinedData ? predefinedData.price : 0;
                }

                let equipmentDailyPriceAfterDiscountIvaInclusive = equipmentOriginalDailyPriceIvaInclusive;

                // Apply base price discount
                const discountPercentage = quoteData ? (parseFloat(item.discount) || 0) :
                    (parseFloat(document.getElementById(`discount${item.itemIndex || i}`)?.value) || 0);
                
                let basePriceDiscountAppliedInfo = "";
                if (discountPercentage > 0) {
                    equipmentDailyPriceAfterDiscountIvaInclusive *= (1 - (discountPercentage / 100));
                    basePriceDiscountAppliedInfo = ` <small>(-${discountPercentage}%)</small>`;
                }

                const equipmentBasePriceDailyIvaInclusiveExport = equipmentDailyPriceAfterDiscountIvaInclusive;
                const equipmentBasePriceDailyNetExport = equipmentBasePriceDailyIvaInclusiveExport / (1 + IVA_RATE);
                overallTotalEquipBaseNetExport += equipmentBasePriceDailyNetExport * numDaysForItem * quantity;

                let equipmentExtraCostDailyIvaInclusiveExport = 0;
                let equipmentExtraCostDailyNetExport = 0;
                let baseHoursEquipVal = 0;
                let extraCostAppliedInfo = "";

                // Handle equipment timing (extra costs) - simplified for saved quotes
                const equipTimingEnabled = quoteData ? (item.equipTimingEnabled || false) :
                    (document.getElementById(`equipTimingToggle${item.itemIndex || i}`)?.checked || false);

                if (equipTimingEnabled) {
                    baseHoursEquipVal = quoteData ? (parseFloat(item.baseHoursEquip) || 0) :
                        (parseFloat(document.getElementById(`baseHoursEquip${item.itemIndex || i}`)?.value) || 0);
                    
                    const extraTimeBlockEquip = quoteData ? (parseFloat(item.extraTimeBlockEquip) || 1) :
                        (parseFloat(document.getElementById(`extraTimeBlockEquip${item.itemIndex || i}`)?.value) || 1);
                    
                    const extraCostBlockEquip = quoteData ? (parseFloat(item.extraCostBlockEquip) || 0) :
                        (parseFloat(document.getElementById(`extraCostBlockEquip${item.itemIndex || i}`)?.value) || 0);
                    
                    if (operationHours > baseHoursEquipVal && extraTimeBlockEquip > 0) {
                        const extraHoursEquip = operationHours - baseHoursEquipVal;
                        const numberOfExtraBlocksEquip = Math.ceil(extraHoursEquip / extraTimeBlockEquip);
                        let currentExtraCostBlockForExport = extraCostBlockEquip;

                        // Apply extra cost discount
                        const extraCostDiscountEnabled = quoteData ? (item.extraCostDiscountEnabled || false) :
                            (document.getElementById(`extraCostDiscountToggle${item.itemIndex || i}`)?.checked || false);
                        
                        if (extraCostDiscountEnabled) {
                            const extraDiscountPercentage = quoteData ? (parseFloat(item.extraCostDiscountPercentage) || 0) :
                                (parseFloat(document.getElementById(`extraCostDiscountPercentage${item.itemIndex || i}`)?.value) || 0);
                            
                            if (extraDiscountPercentage > 0) {
                                currentExtraCostBlockForExport *= (1 - (extraDiscountPercentage / 100));
                                extraCostAppliedInfo = ` <small>(-${extraDiscountPercentage}%)</small>`;
                            }
                        }
                        
                        equipmentExtraCostDailyIvaInclusiveExport = numberOfExtraBlocksEquip * currentExtraCostBlockForExport;
                        equipmentExtraCostDailyNetExport = equipmentExtraCostDailyIvaInclusiveExport / (1 + IVA_RATE);
                        overallTotalEquipExtraTimeCostNetExport += equipmentExtraCostDailyNetExport * numDaysForItem * quantity;
                    }
                }

                const itemEquipTotalDisplayNet = equipmentBasePriceDailyNetExport + equipmentExtraCostDailyNetExport;
                const itemEquipTotalDisplayIvaIncl = equipmentBasePriceDailyIvaInclusiveExport + equipmentExtraCostDailyIvaInclusiveExport;
                const itemEquipTotalForTable = (showPricesWithoutIva ? itemEquipTotalDisplayNet : itemEquipTotalDisplayIvaIncl) * numDaysForItem * quantity;

                const priceUnitDayDisplay = showPricesWithoutIva ? equipmentBasePriceDailyNetExport : equipmentBasePriceDailyIvaInclusiveExport;
                const extraCostUnitDayDisplay = showPricesWithoutIva ? equipmentExtraCostDailyNetExport : equipmentExtraCostDailyIvaInclusiveExport;

                let monitorBasePriceForItemNetExport = 0;
                const numMonitorsExport = monValue;
                if (numMonitorsExport > 0 && !monitorIncluido) {
                    const monitorBaseHoursExport = 5;
                    const extraMonitorHoursExport = Math.max(0, operationHours - monitorBaseHoursExport);
                    const calculatedExtraMonitorHoursCostIvaInclusiveExport = Math.ceil(extraMonitorHoursExport) * MONITOR_HOURLY_EXTRA_IVA_INCLUSIVE;
                    let monitorChargeIvaInclusiveExport = (MONITOR_BASE_CHARGE_IVA_INCLUSIVE + calculatedExtraMonitorHoursCostIvaInclusiveExport) * numMonitorsExport;
                    monitorBasePriceForItemNetExport = monitorChargeIvaInclusiveExport / (1 + IVA_RATE);
                }
                overallTotalMonitorsBaseNetExport += monitorBasePriceForItemNetExport * numDaysForItem;
                const itemMonitorTotalDisplay = (showPricesWithoutIva ? monitorBasePriceForItemNetExport : monitorBasePriceForItemNetExport * (1 + IVA_RATE)) * numDaysForItem;
                const totalItemForRowDisplay = itemEquipTotalForTable + itemMonitorTotalDisplay;
                
                htmlContent += `<tr>
                    <td>${itemName}</td>
                    <td>`;
                htmlContent += `€${priceUnitDayDisplay.toFixed(2)}${basePriceDiscountAppliedInfo}`;
                if (equipTimingEnabled) {
                    htmlContent += ` <small>(Base ${baseHoursEquipVal}h)</small>`;
                    if (equipmentExtraCostDailyIvaInclusiveExport > 0) {
                        const extraHoursTotal = (operationHours > baseHoursEquipVal)
                            ? (operationHours - baseHoursEquipVal)
                            : 0;
                        htmlContent += `<br>+ Extra €${extraCostUnitDayDisplay.toFixed(2)}${extraCostAppliedInfo} <small>(${extraHoursTotal.toFixed(1)}h extra)</small>`;
                    }
                }
                htmlContent += `</td>
                    <td>${quantity}</td>
                    <td>${numDaysForItem}</td>
                    ${itemPeriodText}
                    ${itemTimeText}
                    <td>${numMonitorsExport > 0 ? numMonitorsExport : "-"} ${monitorIncluido && numMonitorsExport > 0 ? "<small>(Incluído)</small>" : ""} ${ (numMonitorsExport > 0 && operationHours > 0) ? `<small>(${operationHours.toFixed(1)}h)</small>` : ""}</td>
                    <td>${operationHours.toFixed(1)}h</td>
                    <td>€${itemEquipTotalForTable.toFixed(2)}</td>
                    <td>€${itemMonitorTotalDisplay.toFixed(2)} ${ numMonitorsExport>0 ? `<small>(${(itemMonitorTotalDisplay / (numMonitorsExport * numDaysForItem)).toFixed(2)}€/und.)</small>` : ''}</td>
                    <td>€${totalItemForRowDisplay.toFixed(2)}</td>
                </tr>`;
            }
            htmlContent += `</tbody></table></div></div>`;

            const transportFeeBaseExport = transportFeeIvaInclusive / (1 + IVA_RATE);

            const subTotalBeforeGlobalDiscountNetExport = overallTotalEquipBaseNetExport; // Global discount applies only to this
            const globalDiscountAmountBaseExport = (subTotalBeforeGlobalDiscountNetExport * (globalDiscountPercent / 100));
            const totalAfterGlobalDiscountNetExport = subTotalBeforeGlobalDiscountNetExport - globalDiscountAmountBaseExport;

            const finalTotalBaseNetExport = totalAfterGlobalDiscountNetExport + overallTotalEquipExtraTimeCostNetExport + overallTotalMonitorsBaseNetExport + transportFeeBaseExport;
            const finalTotalExportDisplay = showPricesWithoutIva ? finalTotalBaseNetExport : finalTotalBaseNetExport * (1 + IVA_RATE);

            htmlContent += `<div class="summary-section"><p><strong>Resumo do Orçamento:</strong></p>`;
            const ivaTextForSummary = showPricesWithoutIva ? " +IVA" : "";

            const equipEAnimacoesNetExport = overallTotalEquipBaseNetExport + overallTotalEquipExtraTimeCostNetExport;
            const equipEAnimacoesComIvaExport = equipEAnimacoesNetExport * (1 + IVA_RATE);

            htmlContent += `<p>Equipamentos e Animações: €${(showPricesWithoutIva ? equipEAnimacoesNetExport : equipEAnimacoesComIvaExport).toFixed(2)}${ivaTextForSummary}</p>`;
            const totalMonDisplay = showPricesWithoutIva ? overallTotalMonitorsBaseNetExport : overallTotalMonitorsBaseNetExport * (1+IVA_RATE);
            let monLine = `€${totalMonDisplay.toFixed(2)}`;
            if (overallMonitorCountDays > 0) {
                const unit = totalMonDisplay / overallMonitorCountDays;
                monLine += ` <small>(${unit.toFixed(2)}€/und.)</small>`;
            }
            htmlContent += `<p>Total Monitores: ${monLine}${ivaTextForSummary}</p>`;
            if (transportFeeIvaInclusive > 0) {
                if (selectedTransportLocationsForExport.length > 0) {
                selectedTransportLocationsForExport.forEach(transport => {
                    const transportFeeNet = transport.fee / (1 + IVA_RATE);
                    const displayFee = showPricesWithoutIva ? transportFeeNet : transport.fee;
                    htmlContent += `<p>Transporte (${transport.location}): €${displayFee.toFixed(2)}${ivaTextForSummary}</p>`;
                });
            }
            }
            if (globalDiscountPercent > 0) {
                const subtotalAllBeforeDiscountExportNet = equipEAnimacoesNetExport + overallTotalMonitorsBaseNetExport + transportFeeBaseExport;
                const subtotalAllBeforeDiscountExportComIva = equipEAnimacoesComIvaExport + (overallTotalMonitorsBaseNetExport * (1 + IVA_RATE)) + transportFeeIvaInclusive;
                htmlContent += `<p>SUBTOTAL: €${(showPricesWithoutIva ? subtotalAllBeforeDiscountExportNet : subtotalAllBeforeDiscountExportComIva).toFixed(2)}${ivaTextForSummary}</p>`;

                const baseValueForDiscountTextNet = overallTotalEquipBaseNetExport;
                const baseValueForDiscountTextComIva = overallTotalEquipBaseNetExport * (1 + IVA_RATE);
                htmlContent += `<p class="discount-line">Desconto sobre o valor dos Equipamentos (${globalDiscountPercent}% s/ €${(showPricesWithoutIva ? baseValueForDiscountTextNet : baseValueForDiscountTextComIva).toFixed(2)}): -€${(showPricesWithoutIva ? globalDiscountAmountBaseExport : globalDiscountAmountBaseExport * (1+IVA_RATE)).toFixed(2)}${ivaTextForSummary}</p>`;
            }
            htmlContent += `<p class="grand-total-final"><strong>VALOR FINAL: €${finalTotalExportDisplay.toFixed(2)}</strong></p>`;
            if (showPricesWithoutIva) {
                htmlContent += `<p class="item-notes">A todos os valores apresentados acresce IVA à taxa legal em vigor (${(IVA_RATE*100).toFixed(0)}%).</p>`;
            } else {
                htmlContent += `<p class="item-notes">Valores com IVA incluído à taxa legal em vigor (${(IVA_RATE*100).toFixed(0)}%).</p>`;
            }
            htmlContent += `</div>`;

            htmlContent += `<div class="general-conditions-section">`;
            htmlContent += `<h3>Condições Gerais:</h3>`;
            htmlContent += `<ul>`;
            if (showPricesWithoutIva) {
                htmlContent += `<li>A todos os valores acima mencionados acresce IVA à taxa legal em vigor (${(IVA_RATE*100).toFixed(0)}%).</li>`;
            } else {
                htmlContent += `<li>Os valores apresentados já incluem o IVA à taxa legal em vigor (${(IVA_RATE*100).toFixed(0)}%).</li>`;
            }
            
            // Add discount note only if there's a discount applied
            const hasDiscountApplied = quoteData ? 
                (parseFloat(quoteData.discount) > 0 || quoteData.items?.some(item => parseFloat(item.discount) > 0)) :
                (parseFloat(document.getElementById('discount').value || 0) > 0 || 
                 Array.from({length: idx}).some((_, i) => parseFloat(document.getElementById(`discount${i}`)?.value || 0) > 0));
            
            if (hasDiscountApplied) {
                htmlContent += `<li>O desconto não é aplicado aos recursos humanos, consumíveis nem taxas de deslocação.</li>`;
            }
            htmlContent += `<li>O local da actividade será a designar atempadamente pelo Cliente.</li>`;
            htmlContent += `<li>Os valores apresentados são válidos durante o ano de 2025.</li>`;
            htmlContent += `<li>A disponibilidade das actividades referidas nesta proposta só poderá ser confirmada aquando da adjudicação por escrito.</li>`;
            htmlContent += `</ul>`;

            if (includeCondPagamento && condPagamentoSelecionada) {
                htmlContent += `<h3>Condições de Pagamento:</h3>`;
                // Add period at the end if it doesn't already have one
                const condPagamentoComPonto = condPagamentoSelecionada.endsWith('.') ? 
                    condPagamentoSelecionada : 
                    condPagamentoSelecionada + '.';
                htmlContent += `<p>${condPagamentoComPonto}</p>`;
            }

            if (includeMetPagamento && metodosPagamentoSelecionados.length > 0) {
                htmlContent += `<h3>Método de pagamento:</h3>`;
                htmlContent += `<p>O pagamento no valor total de €${finalTotalExportDisplay.toFixed(2)} deverá ser efetuado até ao ato da montagem numa das seguintes formas:</p>`;
                htmlContent += `<ul>`;
                metodosPagamentoSelecionados.forEach(metodo => {
                    htmlContent += `<li>${metodo}</li>`;
                });
                htmlContent += `</ul>`;
                htmlContent += `<p>Caso pretenda número de contribuinte na fatura, por favor, envie-nos os seus dados fiscais.</p>`;
            }
            
            htmlContent += `</div>`;

            const sellerSignatureDetails = sellerSignatures[sellerName];
            if (sellerSignatureDetails) {
                htmlContent += `<div class="seller-signature">${sellerSignatureDetails.replace(/\\n/g, '<br>')}</div>`;
            }
            
            // Add company info after signature - same font size as signature
            htmlContent += `<div style="margin-top: 20px; text-align: center;"><p style="font-size: 9pt; margin: 0; color: #555;">MY DYNAMIC</p><p style="font-size: 9pt; margin: 0; color: #555;">www.dynamickids.pt</p></div>`;
            
            htmlContent += `</div>`;

            return htmlContent;
        }





        function getQuoteDataForSave() {
            // Create complete item data with all fields including equipment details
            const items = [];
            for (let i = 0; i < idx; i++) {
                const itemDiv = document.getElementById(`item${i}`);
                if (itemDiv) {
                    const nameInput = document.getElementById(`name${i}`);
                    if (nameInput && nameInput.value.trim() !== "") {
                        const itemName = nameInput.value.trim();
                        const equipmentDetails = equipmentData[itemName] || {};
                        const priceInput = document.getElementById(`price${i}`);
                        
                        items.push({
                            name: itemName,
                            quantity: document.getElementById(`quantity${i}`).value,
                            price: priceInput.value,
                            discount: document.getElementById(`discount${i}`).value,
                            equipTimingEnabled: document.getElementById(`equipTimingToggle${i}`).checked,
                            baseHoursEquip: document.getElementById(`baseHoursEquip${i}`).value,
                            extraTimeBlockEquip: document.getElementById(`extraTimeBlockEquip${i}`).value,
                            extraCostBlockEquip: document.getElementById(`extraCostBlockEquip${i}`).value,
                            extraCostDiscountEnabled: document.getElementById(`extraCostDiscountToggle${i}`).checked,
                            extraCostDiscountPercentage: document.getElementById(`extraCostDiscountPercentage${i}`).value,
                            itemFromDate: document.getElementById(`itemFromDate${i}`).value,
                            itemToDate: document.getElementById(`itemToDate${i}`).value,
                            itemFromTime: document.getElementById(`itemFromTime${i}`).value,
                            itemToTime: document.getElementById(`itemToTime${i}`).value,
                            monitors: document.getElementById(`mon${i}`).value,
                            monitorIncluido: document.getElementById(`monitorIncluido${i}`).checked,
                            manualOverride: priceInput.dataset.manualOverride === 'true',
                            enteredWithIvaExclusive: priceInput.dataset.enteredWithIvaExclusive === 'true',
                            
                            // Add equipment details for images/descriptions
                            equipmentDetails: {
                                image_url: equipmentDetails.image_url || null,
                                description: equipmentDetails.description || '',
                                price: equipmentDetails.price || 0
                            }
                        });
                    }
                }
            }
            
            return {
                clientName: document.getElementById('clientName').value,
                sellerName: document.getElementById('sellerName').value,
                fromDate: document.getElementById('fromDate').value,
                toDate: document.getElementById('toDate').value,
                fromTime: document.getElementById('fromTime').value,
                toTime: document.getElementById('toTime').value,
                globalDatesApply: document.getElementById('globalDatesApply').checked,
                globalTimesApply: document.getElementById('globalTimesApply').checked,
                iva: document.getElementById('iva').checked,
                discount: document.getElementById('discount').value,
                selectedTransportLocations: [...selectedTransportLocations],
                includeCondPagamentoExport: document.getElementById('includeCondPagamentoExport').checked,
                condPagamento: document.querySelector('input[name="condPagamento"]:checked')?.value,
                includeMetPagamentoExport: document.getElementById('includeMetPagamentoExport').checked,
                metPagDinheiro: document.getElementById('metPagDinheiro')?.checked,
                metPagMbway: document.getElementById('metPagMbway')?.checked,
                metPagCheque: document.getElementById('metPagCheque')?.checked,
                metPagTransf: document.getElementById('metPagTransf')?.checked,
                items: items,
            };
        }
        
        async function saveQuote() {
            const clientNameInput = document.getElementById('clientName');
            const currentDate = new Date().toLocaleDateString('pt-PT');
            const clientNameFromForm = clientNameInput.value.trim();
            
            // Create a better suggestion: "Cliente - Data" or just "Data" if no client name
            let defaultPromptValue;
            if (clientNameFromForm) {
                defaultPromptValue = `${clientNameFromForm} - ${currentDate}`;
            } else {
                defaultPromptValue = currentDate;
            }
            const clientName = prompt("Por favor, insira o nome do cliente para este orçamento:", defaultPromptValue);
            
            if (clientName === null || clientName.trim() === "") {
                if (clientName !== null) {
                     alert("O nome do cliente não pode estar em branco.");
                }
                return;
            }

            const saveButton = document.getElementById('saveQuoteBtn');
            const originalButtonText = saveButton.innerHTML;
            const originalButtonState = saveButton.disabled;

            // Show loading state
            saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A guardar...';
            saveButton.disabled = true;

            const trimmedQuoteName = clientName.trim();
            const quoteState = getQuoteDataForSave();
            // Keep the original client name from the form, add quote name separately
            quoteState.quoteName = trimmedQuoteName;
            // clientName stays as it was from the form (the real client name)

            try {
                const response = await fetch('api.php?endpoint=save_quote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(quoteState)
                });

                const result = await response.json();

                if (result.success) {
                    // Show success state briefly
                    saveButton.innerHTML = '<i class="fas fa-check"></i> Guardado!';
                    
                    setTimeout(() => {
                        alert(result.message);
                        displaySavedQuotes(); // Refresh the quotes list
                        
                        // Reset button state
                        saveButton.innerHTML = originalButtonText;
                        saveButton.disabled = originalButtonState;
                    }, 800);
                } else {
                    alert('Erro ao guardar orçamento: ' + (result.error || 'Erro desconhecido'));
                    
                    // Reset button state
                    saveButton.innerHTML = originalButtonText;
                    saveButton.disabled = originalButtonState;
                }
            } catch (error) {
                console.error('Error saving quote:', error);
                alert('Erro de conectividade ao guardar orçamento.');
                
                // Reset button state
                saveButton.innerHTML = originalButtonText;
                saveButton.disabled = originalButtonState;
            }
        }

        async function displaySavedQuotes() {
            console.log('displaySavedQuotes() called');
            
            const listContainer = document.getElementById('savedQuotationsList');
            if (!listContainer) {
                console.error('savedQuotationsList element not found!');
                return;
            }
            
            // Show loading state
            listContainer.innerHTML = '<p style="text-align: center; color: #777;"><i class="fas fa-spinner fa-spin"></i> A carregar orçamentos...</p>';

            try {
                const response = await fetch('api.php?endpoint=quotes&v=' + Date.now(), { cache: 'no-store' });
                const savedQuotes = await response.json();
                
                console.log('Loaded quotes from server:', savedQuotes.length, 'quotes found');
                
                listContainer.innerHTML = '';

                if (!Array.isArray(savedQuotes) || savedQuotes.length === 0) {
                    console.log('No quotes found, showing empty message');
                    listContainer.innerHTML = '<p style="text-align: center; color: #777;">Não há orçamentos guardados.</p>';
                    return;
                }

                // Quotes are already sorted by date (newest first) from the server
                savedQuotes.forEach(quote => {
                    const quoteEl = document.createElement('div');
                    quoteEl.className = 'saved-quote-item';
                    
                    const quoteInfo = document.createElement('div');
                    quoteInfo.className = 'saved-quote-info';
                    // Use quoteName for display, fallback to clientName for old quotes
                    const displayName = quote.quoteName || quote.clientName || 'Orçamento Sem Nome';
                    quoteInfo.textContent = displayName;

                    const quoteActions = document.createElement('div');
                    quoteActions.className = 'saved-quote-actions';

                    const viewButton = document.createElement('button');
                    viewButton.innerHTML = '<i class="fas fa-eye"></i><span>Ver</span>';
                    viewButton.title = 'Ver Orçamento';
                    viewButton.className = 'view-quote-btn';
                    viewButton.setAttribute('data-quote-id', quote.id);
                    viewButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const quoteId = this.getAttribute('data-quote-id');
                        console.log("View button clicked for quote ID:", quoteId);
                        viewQuote(quoteId);
                    });

                    const loadButton = document.createElement('button');
                    loadButton.innerHTML = '<i class="fas fa-upload"></i><span>Carregar</span>';
                    loadButton.title = 'Carregar Orçamento';
                    loadButton.className = 'load-quote-btn';
                    loadButton.setAttribute('data-quote-id', quote.id);
                    loadButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const quoteId = this.getAttribute('data-quote-id');
                        loadQuote(quoteId);
                    });

                    const deleteButton = document.createElement('button');
                    deleteButton.className = 'delete-btn';
                    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i><span>Apagar</span>';
                    deleteButton.title = 'Apagar Orçamento';
                    deleteButton.setAttribute('data-quote-id', quote.id);
                    deleteButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const quoteId = this.getAttribute('data-quote-id');
                        deleteQuote(quoteId);
                    });

                    quoteActions.appendChild(viewButton);
                    quoteActions.appendChild(loadButton);
                    quoteActions.appendChild(deleteButton);

                    quoteEl.appendChild(quoteInfo);
                    quoteEl.appendChild(quoteActions);
                    listContainer.appendChild(quoteEl);
                });
            } catch (error) {
                console.error('Error loading quotes:', error);
                listContainer.innerHTML = '<p style="text-align: center; color: #e74c3c;">Erro ao carregar orçamentos. Tente novamente.</p>';
            }
        }
        
        async function openQuoteInNewWindow(quoteData, existingWindow = null) {
            const quoteHtml = await buildQuoteHtml(quoteData);

            const quoteWindow = existingWindow || window.open('', '_blank');
            if (quoteWindow) {
                // Popup allowed - use new window
                quoteWindow.document.write('<html><head><title>Visualizar Orçamento</title></head><body></body></html>');
                quoteWindow.document.close();

                const jspdfScript = quoteWindow.document.createElement('script');
                jspdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
                quoteWindow.document.head.appendChild(jspdfScript);

                const html2canvasScript = quoteWindow.document.createElement('script');
                html2canvasScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
                quoteWindow.document.head.appendChild(html2canvasScript);

                quoteWindow.document.body.innerHTML = quoteHtml;
                
                html2canvasScript.onload = () => {
                    const downloadBtn = quoteWindow.document.createElement('button');
                    downloadBtn.textContent = 'Download PDF';
                    downloadBtn.style.position = 'fixed';
                    downloadBtn.style.top = '10px';
                    downloadBtn.style.right = '10px';
                    downloadBtn.style.padding = '10px 15px';
                    downloadBtn.style.border = 'none';
                    downloadBtn.style.backgroundColor = '#005A9C';
                    downloadBtn.style.color = 'white';
                    downloadBtn.style.borderRadius = '5px';
                    downloadBtn.style.cursor = 'pointer';
                    downloadBtn.style.zIndex = '10000';
                    downloadBtn.classList.add('no-print');
                    
                    downloadBtn.onclick = async () => {
                        downloadBtn.textContent = 'A gerar...';
                        downloadBtn.disabled = true;
                        try {
                            const elementToPrint = quoteWindow.document.querySelector('.export-container');
                             const canvas = await quoteWindow.html2canvas(elementToPrint, {
                                scale: 2,
                                useCORS: true,
                                allowTaint: true,
                            });

                            const imgData = canvas.toDataURL('image/png');
                            const { jsPDF } = quoteWindow.jspdf;

                            let pdf = new jsPDF('p', 'mm', 'a4');
                            const imgProps = pdf.getImageProperties(imgData);
                            const pdfWidth = pdf.internal.pageSize.getWidth();
                            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                            pdf = new jsPDF({
                                orientation: 'p',
                                unit: 'mm',
                                format: [pdfWidth, pdfHeight]
                            });

                            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                            const clientNameRaw = quoteData ? quoteData.clientName : (document.getElementById('clientName')?.value || 'orcamento');
                            const clientName = clientNameRaw.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
                            const date = new Date().toISOString().slice(0, 10);
                            pdf.save(`${clientName}_${date}.pdf`);

                        } catch (error) {
                             console.error("Erro ao gerar PDF na janela de visualização:", error);
                             alert("Ocorreu um erro ao gerar o PDF.");
                        } finally {
                            downloadBtn.textContent = 'Download PDF';
                            downloadBtn.disabled = false;
                        }
                    };

                    quoteWindow.document.body.appendChild(downloadBtn);
                };
                
                quoteWindow.focus();
            } else {
                // Popup blocked - show helpful message
                alert("Pop-up bloqueado. Por favor, permita pop-ups para este site e tente novamente.\n\nPara permitir pop-ups:\n• Chrome: Clique no ícone 🚫 na barra de endereços\n• Firefox: Clique em 'Permitir pop-ups'\n• Safari: Preferências → Websites → Pop-ups");
            }
        }

        async function viewQuote(quoteId) {
            console.log("viewQuote called with ID:", quoteId, "type:", typeof quoteId);
            
            // Open popup IMMEDIATELY to avoid blocking - before any async operations
            const preOpenedWindow = window.open('', '_blank');
            if (!preOpenedWindow) {
                // Popup was blocked - show message
                alert("Pop-up bloqueado. Por favor, permita pop-ups para este site e tente novamente.\n\nPara permitir pop-ups:\n• Chrome: Clique no ícone 🚫 na barra de endereços\n• Firefox: Clique em 'Permitir pop-ups'\n• Safari: Preferências → Websites → Pop-ups");
                return;
            }
            
            try {
                const response = await fetch('api.php?endpoint=quotes&v=' + Date.now(), { cache: 'no-store' });
                const savedQuotes = await response.json();
                
                console.log("Loaded quotes:", savedQuotes.length, "quotes");
                console.log("Looking for quote with ID:", quoteId);
                console.log("Available quote IDs:", savedQuotes.map(q => ({id: q.id, type: typeof q.id, clientName: q.clientName})));
                
                // Convert quoteId to number for comparison
                const numericQuoteId = parseInt(quoteId, 10);
                
                // Find the quote by ID
                const quoteToView = savedQuotes.find(q => q.id === numericQuoteId);
                
                if (!quoteToView) {
                    console.error("Quote not found with ID:", quoteId, "converted to:", numericQuoteId);
                    preOpenedWindow.close(); // Close the pre-opened window
                    alert("Orçamento para visualização não encontrado.");
                    return;
                }
                
                console.log("Found quote to view:", quoteToView);
                console.log("[viewQuote] Saved quote data (SAVED):", quoteToView);
                console.log("[viewQuote] Saved items structure:", quoteToView.items);
                
                // Ensure the quote has the same structure as current quotes
                if (!quoteToView.id || typeof quoteToView.id === 'string') {
                    quoteToView.id = numericQuoteId;
                }
                
                console.log("Processed quote data:", quoteToView);
                
                // Use the EXACT same function as calculator quotes - pass the pre-opened window
                await openQuoteInNewWindow(quoteToView, preOpenedWindow);
                
            } catch (error) {
                console.error("Error loading or opening quote:", error);
                preOpenedWindow.close(); // Close the pre-opened window on error
                alert("Ocorreu um erro ao abrir o orçamento: " + error.message);
            }
        }

        function applyQuoteDataToForm(data) {
             if (!data) {
                console.error("No data provided to applyQuoteDataToForm");
                return;
            }

            resetAll(true); // Reset form before loading new data

            document.getElementById('clientName').value = data.clientName || '';
            document.getElementById('sellerName').value = data.sellerName || '';
            document.getElementById('fromDate').value = data.fromDate || today();
            document.getElementById('toDate').value = data.toDate || today();
            document.getElementById('fromTime').value = data.fromTime || '';
            document.getElementById('toTime').value = data.toTime || '';
            document.getElementById('globalDatesApply').checked = data.globalDatesApply;
            document.getElementById('globalTimesApply').checked = data.globalTimesApply;
            document.getElementById('iva').checked = data.iva;
            document.getElementById('discount').value = data.discount || 0;
            // Load selected transportation locations
            selectedTransportLocations = data.selectedTransportLocations || [];
            renderTransportationList();
            populateTransportLocations();
            
            document.getElementById('includeCondPagamentoExport').checked = data.includeCondPagamentoExport;
            if (data.condPagamento) {
                const condRadio = document.querySelector(`input[name="condPagamento"][value="${data.condPagamento}"]`);
                if (condRadio) condRadio.checked = true;
            }
            document.getElementById('includeMetPagamentoExport').checked = data.includeMetPagamentoExport;
            if(document.getElementById('metPagDinheiro')) document.getElementById('metPagDinheiro').checked = data.metPagDinheiro;
            if(document.getElementById('metPagMbway')) document.getElementById('metPagMbway').checked = data.metPagMbway;
            if(document.getElementById('metPagCheque')) document.getElementById('metPagCheque').checked = data.metPagCheque;
            if(document.getElementById('metPagTransf')) document.getElementById('metPagTransf').checked = data.metPagTransf;

            if (data.items && data.items.length > 0) {
                data.items.forEach(itemData => {
                    addItem(); 
                    const currentIdx = idx - 1;
                    
                    document.getElementById(`name${currentIdx}`).value = itemData.name;
                    if (itemData.quantity) {
                        document.getElementById(`quantity${currentIdx}`).value = itemData.quantity;
                    }
                    checkPredefinedPrice(currentIdx); 
                    document.getElementById(`price${currentIdx}`).value = itemData.price;
                    
                    const priceInput = document.getElementById(`price${currentIdx}`);
                    const predefinedPrice = parseFloat(priceInput.dataset.originalIvaInclusivePrice);
                    if (isNaN(predefinedPrice) || parseFloat(itemData.price) !== predefinedPrice) {
                        priceInput.dataset.manualOverride = 'true';
                    }

                    // Set the discount value
                    document.getElementById(`discount${currentIdx}`).value = itemData.basePriceDiscountPercentage || '0';
                    document.getElementById(`equipTimingToggle${currentIdx}`).checked = itemData.equipTimingToggle;
                    document.getElementById(`baseHoursEquip${currentIdx}`).value = itemData.baseHoursEquip;
                    document.getElementById(`extraTimeBlockEquip${currentIdx}`).value = itemData.extraTimeBlockEquip;
                    document.getElementById(`extraCostBlockEquip${currentIdx}`).value = itemData.extraCostBlockEquip;
                    document.getElementById(`extraCostDiscountToggle${currentIdx}`).checked = itemData.extraCostDiscountToggle;
                    document.getElementById(`extraCostDiscountPercentage${currentIdx}`).value = itemData.extraCostDiscountPercentage;
                    document.getElementById(`itemFromDate${currentIdx}`).value = itemData.fromDate;
                    document.getElementById(`itemToDate${currentIdx}`).value = itemData.toDate;
                    document.getElementById(`itemFromTime${currentIdx}`).value = itemData.fromTime;
                    document.getElementById(`itemToTime${currentIdx}`).value = itemData.toTime;
                    document.getElementById(`mon${currentIdx}`).value = itemData.monitors;
                    document.getElementById(`monitorIncluido${currentIdx}`).checked = itemData.monitorIncluido;
                    document.getElementById(`equipTimingToggle${currentIdx}`).dispatchEvent(new Event('change'));
                });
            } else if (idx === 0) { // If there are no items to load, ensure there is one blank item
                addItem();
            }
            
            handleGlobalDatesApplyChange();
            handleGlobalTimesApplyChange();

            update();
            
            document.querySelector('.tab-link[data-tab="calculator"]').click();
            alert(`Orçamento para "${data.clientName}" carregado.`);
        }

        async function loadQuote(quoteId) {
            console.log("loadQuote called with ID:", quoteId, "type:", typeof quoteId);
            
            try {
                const response = await fetch('api.php?endpoint=quotes&v=' + Date.now(), { cache: 'no-store' });
                const savedQuotes = await response.json();
                
                console.log("Loaded quotes for editing:", savedQuotes.length, "quotes");
                console.log("Looking for quote with ID:", quoteId);
                
                // Convert quoteId to number for comparison
                const numericQuoteId = parseInt(quoteId, 10);
                const data = savedQuotes.find(q => q.id === numericQuoteId);

                if (!data) {
                    console.error("Quote not found with ID:", quoteId, "converted to:", numericQuoteId);
                    console.log("Available quote IDs:", savedQuotes.map(q => ({id: q.id, type: typeof q.id, clientName: q.clientName})));
                    alert("Orçamento não encontrado.");
                    return;
                }
                
                console.log("Found quote to load:", data);
                applyQuoteDataToForm(data);

                await new Promise(resolve => setTimeout(resolve, 100));
                
                document.querySelector('.tab-link[data-tab="calculator"]').click();
                alert(`Orçamento para "${data.clientName}" carregado para edição.`);
            } catch (error) {
                console.error('Error loading quote:', error);
                alert('Erro ao carregar orçamento.');
            }
        }

        async function deleteQuote(quoteId) {
            if (!confirm("Tem a certeza que quer apagar este orçamento?")) {
                return;
            }

            console.log("deleteQuote called with ID:", quoteId, "type:", typeof quoteId);

            try {
                // Convert to number to ensure consistency
                const numericQuoteId = parseInt(quoteId, 10);
                
                const response = await fetch('api.php?endpoint=delete_quote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: numericQuoteId })
                });

                const result = await response.json();

                if (result.success) {
                    displaySavedQuotes(); // Refresh the list
                } else {
                    alert('Erro ao apagar orçamento: ' + (result.error || 'Erro desconhecido'));
                }
            } catch (error) {
                console.error('Error deleting quote:', error);
                alert('Erro ao comunicar com o servidor.');
            }
        }

        function resetAll(isLoading = false) {
            document.getElementById('items').innerHTML = '';
            idx = 0;
            document.getElementById('clientName').value = ''; 
            document.getElementById('sellerName').value = ''; 
            document.getElementById('fromDate').value = today();
            document.getElementById('toDate').value = today();
            document.getElementById('fromTime').value = '';
            document.getElementById('toTime').value = '';
            document.getElementById('globalDatesApply').checked = true; 
            document.getElementById('globalTimesApply').checked = true;
            document.getElementById('iva').checked = false;
            document.getElementById('discount').value = '';
            // Clear transportation selections
            selectedTransportLocations = [];
            renderTransportationList();
            populateTransportLocations();
            document.getElementById('excludeDetailsCheckbox').checked = false;
            
            document.getElementById('includeCondPagamentoExport').checked = true;
            if(document.getElementById('condPag5050')) document.getElementById('condPag5050').checked = true;
            
            document.getElementById('includeMetPagamentoExport').checked = true;
            if(document.getElementById('metPagDinheiro')) document.getElementById('metPagDinheiro').checked = true;
            if(document.getElementById('metPagMbway')) document.getElementById('metPagMbway').checked = true;
            if(document.getElementById('metPagCheque')) document.getElementById('metPagCheque').checked = true;
            if(document.getElementById('metPagTransf')) document.getElementById('metPagTransf').checked = true;

            handleGlobalDatesApplyChange();
            handleGlobalTimesApplyChange();

            if (!isLoading) {
                addItem();
            }
            update();
        }

        function checkPasswordAndShowApp() {
            const passwordInput = document.getElementById('passwordInput');
            const passwordError = document.getElementById('passwordError');
            
            // Check if there's a saved password first
            const savedPassword = localStorage.getItem('calculatorPassword');
            if (savedPassword === CORRECT_PASSWORD) {
                passwordError.style.display = 'none';
                document.getElementById('passwordSection').style.display = 'none';
                document.getElementById('appContainer').style.display = 'block';
                document.body.style.alignItems = 'flex-start'; 
                document.body.style.justifyContent = 'flex-start'; 
                document.body.style.minHeight = 'auto'; 
                
                // Inicializar app apenas se ainda não foi inicializado
                if (!window.appInitialized) {
                    initializeApp();
                    window.appInitialized = true;
                }
                
                setupBackToTopButton();
                return true;
            }
            
            // Only check typed password if user has entered something
            if (passwordInput && passwordInput.value.length > 0) {
                if (passwordInput.value === CORRECT_PASSWORD) {
                    localStorage.setItem('calculatorPassword', CORRECT_PASSWORD);
                    passwordError.style.display = 'none';
                    document.getElementById('passwordSection').style.display = 'none';
                    document.getElementById('appContainer').style.display = 'block';
                    document.body.style.alignItems = 'flex-start'; 
                    document.body.style.justifyContent = 'flex-start'; 
                    document.body.style.minHeight = 'auto'; 
                    
                    // Inicializar app apenas se ainda não foi inicializado
                    if (!window.appInitialized) {
                        initializeApp();
                        window.appInitialized = true;
                    }
                    
                    setupBackToTopButton();
                    return true;
                } else {
                    // Only show error if user actually tried to enter a password
                    passwordError.style.display = 'block';
                    passwordInput.value = '';
                    passwordInput.focus();
                    localStorage.removeItem('calculatorPassword');
                    return false;
                }
            }
            
            // No password entered yet, don't show error
            passwordError.style.display = 'none';
            return false;
        }

        async function initializeApp() {
            console.log("Initializing app...");
            
            // Show loading state
            const appContainer = document.querySelector('.container') || document.body;
            const originalContent = appContainer.innerHTML;
            
            // Try to load data, with a small delay to allow server to be ready
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const results = await Promise.allSettled([
                fetchEquipmentData(),
                fetchTransportationFees(),
                fetchPaymentConditions(),
                fetchPaymentMethods()
            ]);
            
            // Check if any critical data failed to load
            const failedLoads = results.filter(result => result.status === 'rejected' || result.value === false);
            if (failedLoads.length > 0) {
                console.log(`${failedLoads.length} data sources failed to load initially. Retrying in background...`);
                
                // Retry failed loads in background without blocking UI
                setTimeout(async () => {
                    console.log("Retrying failed data loads...");
                    await Promise.allSettled([
                        fetchEquipmentData(),
                        fetchTransportationFees(),
                        fetchPaymentConditions(),
                        fetchPaymentMethods()
                    ]);
                    
                    // Repopulate UI with fresh data
                    populateTransportLocations();
                    populatePaymentConditions();
                    populatePaymentMethods();
                    populateEquipmentDropdowns();
                    console.log("Background data reload completed.");
                }, 2000);
            }

            populateTransportLocations();
            populatePaymentConditions();
            populatePaymentMethods();
            populateEquipmentDropdowns(); 
            
            // Initialize app state
            resetAll(true); // Pass true to indicate loading state
            addItem(); // Add one equipment box for user to start with
            
            document.getElementById('globalDatesApply').onchange = handleGlobalDatesApplyChange;
            document.getElementById('globalTimesApply').onchange = handleGlobalTimesApplyChange;
            document.getElementById('iva').onchange = handleGlobalPriceControlsChange;
            document.getElementById('discount').oninput = handleGlobalPriceControlsChange;
            // Setup transportation controls
            document.getElementById('addTransportBtn').onclick = () => {
                const dropdown = document.getElementById('transportLocationDropdown');
                if (dropdown.value) {
                    addTransportLocation(dropdown.value);
                    dropdown.value = ''; // Reset dropdown
                }
            };
            
            // Add missing event handlers for global date and time inputs
            document.getElementById('fromDate').onchange = update;
            document.getElementById('toDate').onchange = update;
            document.getElementById('fromTime').onchange = update;
            document.getElementById('toTime').onchange = update;

            document.getElementById('searchEquipmentInput').addEventListener('input', (e) => {
                displayEquipmentList(e.target.value);
            });

            document.getElementById('addEquipmentForm').addEventListener('submit', handleAddNewEquipment);
            
            // Tab navigation
            document.querySelectorAll('.tab-link').forEach(tab => {
                tab.addEventListener('click', (event) => {
                    const tabLink = event.target.closest('.tab-link');
                    if (!tabLink) return;
                    
                    const tabName = tabLink.getAttribute('data-tab');
                    
                    // Update tab links
                    document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
                    tabLink.classList.add('active');

                    // Update tab content
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                        if (content.id === `${tabName}Section`) {
                            content.classList.add('active');
                        }
                    });
                    
                    // Refresh saved quotes when switching to quotations tab
                    if (tabName === 'quotations') {
                        displaySavedQuotes();
                    }
                });
            });

            document.getElementById('saveQuoteBtn').addEventListener('click', saveQuote);
            document.getElementById('viewCurrentQuoteBtn').addEventListener('click', async () => {
                console.log("[viewCurrentQuoteBtn] Button clicked");
                try {
                    console.log("[viewCurrentQuoteBtn] Opening live quote in new window (using DOM values)...");
                    await openQuoteInNewWindow(null); // pass null so exporter usa valores do DOM directamente
                    console.log("[viewCurrentQuoteBtn] Quote opened successfully in new window");
                } catch (error) {
                    console.error("[viewCurrentQuoteBtn] Error viewing current quote:", error);
                    console.error("[viewCurrentQuoteBtn] Error stack:", error.stack);
                    alert("Ocorreu um erro ao visualizar o orçamento: " + error.message);
                }
            });

            displayEquipmentList();
            displaySavedQuotes();
        }

        function showTab(tabIdToShow, clickedButton) {
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.style.display = 'none';
            });

            const tabLinks = document.querySelectorAll('.tab-link');
            tabLinks.forEach(link => {
                link.classList.remove('active');
            });

            document.getElementById(tabIdToShow).style.display = 'block';
            clickedButton.classList.add('active');
        }

        /* --- Equipment Management Functions --- */
        let currentlyEditingEquipmentName = null;

        function displayEquipmentList(searchTerm = '') {
            const equipmentTableDiv = document.getElementById('equipmentTable');
            equipmentTableDiv.innerHTML = ''; // Clear previous content
            equipmentTableDiv.className = 'equipment-cards-container'; // Use a container class for flexbox styling

            const lowercasedSearchTerm = searchTerm.toLowerCase();

            const filteredEquipment = Object.keys(equipmentData).filter(name =>
                name.toLowerCase().includes(lowercasedSearchTerm)
            );

            if (filteredEquipment.length === 0) {
                equipmentTableDiv.innerHTML = '<p>Nenhum equipamento encontrado.</p>';
                return;
            }

            // Sort alphabetically by equipment name
            filteredEquipment.sort((a, b) => a.localeCompare(b));

            filteredEquipment.forEach(equipName => {
                const equipment = equipmentData[equipName];
                if (!equipment) return;

                const card = document.createElement('div');
                card.className = 'equipment-card';

                // Use the processed image_url and encode it for the URL with optimization
                const imageUrl = equipment.image_url ? `imagens/${encodeURIComponent(equipment.image_url)}` : 'imagens/logo-orca.png';

                card.innerHTML = `
                    <div class="equipment-card-image-container">
                        <img src="${imageUrl}" alt="${equipName}" onerror="this.onerror=null;this.src='imagens/logo-orca.png'; console.error('Failed to load image for ${equipName} at path: ${imageUrl}');">
                    </div>
                    <div class="equipment-card-content">
                        <h4 class="equipment-card-title">${equipName}</h4>
                        <p class="equipment-card-price">Preço: ${equipment.price.toFixed(2)}€</p>
                        <p class="equipment-card-description">${equipment.description.replace(/\\n/g, '<br>')}</p>
                         <div class="equipment-card-actions">
                            <button class="edit-btn" onclick="handleEditEquipment('${equipName}')"><i class="fas fa-pencil-alt"></i> Editar</button>
                            <button class="delete-btn" onclick="handleDeleteEquipment('${equipName}')"><i class="fas fa-trash-alt"></i> Apagar</button>
                        </div>
                    </div>
                `;
                equipmentTableDiv.appendChild(card);
            });
        }

        function validateFileName(filename) {
            if (!filename) return { valid: true, message: '' };
            
            // Check for problematic characters that might cause server issues
            const problematicChars = /[^\w\s.-]/g;
            const hasProblematicChars = problematicChars.test(filename);
            
            if (hasProblematicChars) {
                return {
                    valid: false,
                    message: 'O nome do ficheiro contém caracteres especiais que podem causar problemas. Por favor, use apenas letras, números, espaços, pontos e traços.'
                };
            }
            
            // Check for very long filenames
            if (filename.length > 255) {
                return {
                    valid: false,
                    message: 'O nome do ficheiro é muito longo. Por favor, use um nome mais curto.'
                };
            }
            
            // Check for valid file extensions
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
            const hasValidExtension = validExtensions.some(ext => 
                filename.toLowerCase().endsWith(ext)
            );
            
            if (!hasValidExtension) {
                return {
                    valid: false,
                    message: 'Formato de ficheiro não suportado. Use JPG, PNG, GIF, WEBP ou BMP.'
                };
            }
            
            return { valid: true, message: '' };
        }

        function compressImage(file, maxWidth = 600, maxHeight = 400, quality = 0.6) {
            return new Promise((resolve) => {
                const canvas = document.createElement('canvas');
                const ctx    = canvas.getContext('2d');
                const img    = new Image();

                img.onload = function () {
                    // --- resize logic (unchanged) ---
                    let { width, height } = this;
                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width  = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width  = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width  = width;
                    canvas.height = height;

                    // Decide output format
                    const isPng = (file.type === 'image/png') || (file.name && file.name.toLowerCase().endsWith('.png'));

                    // Only paint an opaque background when we are ABOUT to export to a format without alpha
                    if (!isPng) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, width, height);
                    } else {
                        ctx.clearRect(0, 0, width, height); // keep transparency
                    }

                    ctx.drawImage(this, 0, 0, width, height);

                    const mimeType = isPng ? 'image/png' : 'image/jpeg';
                    const q        = isPng ? 1 : quality; // quality ignored for PNG

                    canvas.toBlob(resolve, mimeType, q);
                };

                img.src = URL.createObjectURL(file);
            });
        }

        async function submitFormWithRetry(formData, maxRetries = 3) {
            let lastError;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`Attempt ${attempt} to submit form...`);
                    
                    // Add timeout to fetch request to prevent hanging
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
                    
                    const response = await fetch('api.php?endpoint=add_equipment', {
                        method: 'POST',
                        body: formData,
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        // Try to get error message from response
                        let errorMessage = `HTTP ${response.status}`;
                        try {
                            const errorData = await response.json();
                            errorMessage = errorData.error || errorMessage;
                        } catch (e) {
                            // If JSON parsing fails, use the status text
                            errorMessage = response.statusText || errorMessage;
                        }
                        throw new Error(errorMessage);
                    }
                    
                    const result = await response.json();
                    console.log('Form submitted successfully:', result);
                    return result;
                    
                } catch (error) {
                    console.error(`Attempt ${attempt} failed:`, error);
                    lastError = error;
                    
                    // Check for specific error types
                    const errorMessage = error.message.toLowerCase();
                    
                    if (errorMessage.includes('508') || errorMessage.includes('resource limit') || errorMessage.includes('too many requests')) {
                        // Resource limit error - wait progressively longer
                        if (attempt < maxRetries) {
                            const delay = 1500 * attempt; // 1.5s, 3s, 4.5s
                            console.log(`Resource limit detected. Waiting ${delay}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                    } else if (errorMessage.includes('failed to fetch') || errorMessage.includes('network') || errorMessage.includes('aborted')) {
                        // Network error - shorter delay before retry
                        if (attempt < maxRetries) {
                            const delay = 1000 * attempt; // 1s, 2s, 3s
                            console.log(`Network error detected. Waiting ${delay}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                    } else if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
                        // Server error - brief delay before retry
                        if (attempt < maxRetries) {
                            const delay = 500 * attempt; // 0.5s, 1s, 1.5s
                            console.log(`Server error detected. Waiting ${delay}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                    } else {
                        // Other errors (validation, etc.) - don't retry
                        throw error;
                    }
                }
            }
            
            // If we get here, all retries failed
            throw lastError;
        }

        async function handleAddNewEquipment(event) {
            event.preventDefault(); 
            const nameInput = document.getElementById('newEquipName');
            const priceInput = document.getElementById('newEquipPrice');
            const descriptionInput = document.getElementById('newEquipDescription');
            const imageInput = document.getElementById('newEquipImage');
            const existingImageUrlInput = document.getElementById('existingImageUrl');

            let name = nameInput.value.trim();
            
            console.log('Original name:', nameInput.value.trim());
            console.log('Final name:', name);
            
            const price = parseFloat(priceInput.value);
            const description = descriptionInput.value.trim();

            if (!name || isNaN(price) || price <= 0) {
                alert("Por favor, preencha o nome e um preço válido (maior que zero) para o equipamento.");
                return;
            }

            if (currentlyEditingEquipmentName && name !== currentlyEditingEquipmentName && equipmentData.hasOwnProperty(name)) {
                alert("Já existe um equipamento com este novo nome. Escolha um nome diferente.");
                return;
            }

            // Validate uploaded file if present
            if (imageInput.files[0]) {
                const fileValidation = validateFileName(imageInput.files[0].name);
                if (!fileValidation.valid) {
                    alert(fileValidation.message);
                    return;
                }
            }

            // Show loading state
            const submitButton = document.getElementById('addEquipmentForm').querySelector('button[type="submit"]');
            const originalButtonContent = submitButton.innerHTML;
            const isEditing = currentlyEditingEquipmentName !== null;
            
            submitButton.innerHTML = isEditing ? 
                '<i class="fas fa-spinner fa-spin"></i> A guardar alterações...' : 
                '<i class="fas fa-spinner fa-spin"></i> A adicionar...';
            submitButton.disabled = true;

            try {
                const formData = new FormData();
                // Explicitly encode to ensure proper character handling
                formData.append('name', encodeURIComponent(name));
                formData.append('price', price);
                formData.append('description', encodeURIComponent(description));
                
                // Compress image before upload to reduce server load
                if (imageInput.files[0]) {
                    try {
                        console.log('Compressing image...');
                        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A comprimir imagem...';
                        const compressedFile = await compressImage(imageInput.files[0]);
                        formData.append('image', compressedFile, imageInput.files[0].name);
                        submitButton.innerHTML = isEditing ? 
                            '<i class="fas fa-spinner fa-spin"></i> A guardar alterações...' : 
                            '<i class="fas fa-spinner fa-spin"></i> A adicionar...';
                    } catch (error) {
                        console.error('Image compression failed:', error);
                        // Fallback to original file if compression fails
                        formData.append('image', imageInput.files[0]);
                    }
                }
                
                if (currentlyEditingEquipmentName) {
                    console.log('Editing equipment:', currentlyEditingEquipmentName);
                    formData.append('currently_editing_name', currentlyEditingEquipmentName);
                    formData.append('existing_image_url', existingImageUrlInput.value);
                } else {
                    console.log('Adding new equipment');
                }

                // Debug: show what we're sending
                console.log('Sending FormData:');
                for (let [key, value] of formData.entries()) {
                    console.log(`${key}:`, value);
                }

                const result = await submitFormWithRetry(formData, 3); // Increase retries to 3
                console.log('Result received from API:', result);
                
                equipmentData = result;
                processEquipmentData();
                alert('Equipamento guardado com sucesso!');
                
                displayEquipmentList(document.getElementById('searchEquipmentInput').value);
                populateEquipmentDropdowns();
                
                cancelEditEquipment();
                nameInput.focus();
                
            } catch (error) {
                console.error('Erro ao guardar equipamento:', error);
                
                // Provide user-friendly error messages
                let userMessage = error.message;
                if (error.message.toLowerCase().includes('resource limit') || error.message.toLowerCase().includes('508')) {
                    userMessage = 'O servidor está temporariamente sobrecarregado. Sugestões:\n• Reduza o tamanho da imagem\n• Tente novamente em alguns minutos\n• Use uma imagem de menor qualidade';
                } else if (error.message.toLowerCase().includes('failed to fetch')) {
                    userMessage = 'Problema de conexão. Verifique sua internet e tente novamente.';
                }
                
                alert(`Erro ao guardar equipamento: ${userMessage}`);
            } finally {
                // Restore button state
                submitButton.innerHTML = originalButtonContent;
                submitButton.disabled = false;
            }
        }

        function cancelEditEquipment() {
            document.getElementById('addEquipmentForm').reset();
            document.getElementById('imagePreview').src = 'imagens/logo-orca.png';
            
            // Clear custom file upload UI
            const selectedFileName = document.getElementById('selectedFileName');
            const clearImageButton = document.getElementById('clearImageButton');
            if (selectedFileName) selectedFileName.textContent = '';
            if (clearImageButton) clearImageButton.style.display = 'none';
            
            const submitButton = document.getElementById('addEquipmentForm').querySelector('button[type="submit"]');
            submitButton.innerHTML = '<i class="fas fa-plus"></i> Adicionar';
            submitButton.className = 'add';
            
            currentlyEditingEquipmentName = null;
            
            const cancelButton = document.getElementById('cancelEditBtn');
            if (cancelButton) {
                cancelButton.remove();
            }
            
            // Show original cancel button again
            const originalCancelButton = document.getElementById('cancelAddButton');
            if (originalCancelButton) {
                originalCancelButton.style.display = '';
            }
        }

        function handleEditEquipment(equipmentName) {
            console.log("handleEditEquipment called for:", equipmentName);
            if (!equipmentData.hasOwnProperty(equipmentName)) {
                alert("Equipamento não encontrado para edição.");
                console.error("Equipamento não encontrado para edição:", equipmentName);
                return;
            }
            const equip = equipmentData[equipmentName];
            document.getElementById('newEquipName').value = equipmentName;
            document.getElementById('newEquipPrice').value = equip.price;
            document.getElementById('newEquipDescription').value = equip.description || '';
            
            const imagePreview = document.getElementById('imagePreview');
            const existingImageUrlInput = document.getElementById('existingImageUrl');
            const selectedFileName = document.getElementById('selectedFileName');
            const clearImageButton = document.getElementById('clearImageButton');
            
            if (equip.image_url) {
                imagePreview.src = 'imagens/' + equip.image_url + '?' + new Date().getTime(); // Bust cache
                existingImageUrlInput.value = equip.image_url;
                selectedFileName.textContent = `Imagem atual: ${equip.image_url}`;
                clearImageButton.style.display = 'flex';
            } else {
                imagePreview.src = 'imagens/logo-orca.png';
                existingImageUrlInput.value = '';
                selectedFileName.textContent = '';
                clearImageButton.style.display = 'none';
            }
            document.getElementById('newEquipImage').value = ''; // Clear file input

            currentlyEditingEquipmentName = equipmentName;
            
            const submitButton = document.getElementById('addEquipmentForm').querySelector('button[type="submit"]');
            submitButton.innerHTML = '<i class="fas fa-save"></i> Guardar Alterações';
            submitButton.className = 'save';

            // Hide original cancel button
            const originalCancelButton = document.getElementById('cancelAddButton');
            if (originalCancelButton) {
                originalCancelButton.style.display = 'none';
            }

            // Add Edit Cancel button
            const form = document.getElementById('addEquipmentForm');
            let cancelButton = document.getElementById('cancelEditBtn');
            if (!cancelButton) {
                cancelButton = document.createElement('button');
                cancelButton.type = 'button';
                cancelButton.id = 'cancelEditBtn';
                cancelButton.innerHTML = '<i class="fas fa-times"></i> Cancelar Edição';
                cancelButton.className = 'reset';
                cancelButton.style.marginLeft = '10px';
                cancelButton.onclick = () => {
                    cancelEditEquipment();
                    document.getElementById('addEquipmentFormContainer').scrollIntoView({ behavior: 'smooth' });
                };
                submitButton.insertAdjacentElement('afterend', cancelButton);
            }

            document.getElementById('newEquipName').focus();
            document.getElementById('addEquipmentFormContainer').scrollIntoView({ behavior: 'smooth' });
        }

        async function deleteEquipmentWithRetry(equipmentName, maxRetries = 3) {
            let lastError;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`Delete attempt ${attempt} for ${equipmentName}...`);
                    
                    const response = await fetch('api.php?endpoint=delete_equipment', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name: equipmentName })
                    });
                    
                    if (!response.ok) {
                        let errorMessage = `HTTP ${response.status}`;
                        try {
                            const errorData = await response.json();
                            errorMessage = errorData.error || errorMessage;
                        } catch (e) {
                            errorMessage = response.statusText || errorMessage;
                        }
                        throw new Error(errorMessage);
                    }
                    
                    const result = await response.json();
                    console.log('Equipment deleted successfully:', result);
                    return result;
                    
                } catch (error) {
                    console.error(`Delete attempt ${attempt} failed:`, error);
                    lastError = error;
                    
                    const errorMessage = error.message.toLowerCase();
                    
                    if (errorMessage.includes('508') || errorMessage.includes('resource limit')) {
                        if (attempt < maxRetries) {
                            const delay = 1500 * attempt; // 1.5s, 3s, 4.5s
                            console.log(`Resource limit detected. Waiting ${delay}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                    } else if (errorMessage.includes('failed to fetch') || errorMessage.includes('network')) {
                        if (attempt < maxRetries) {
                            const delay = 1000 * attempt; // 1s, 2s, 3s
                            console.log(`Network error detected. Waiting ${delay}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            continue;
                        }
                    } else {
                        // Other errors - don't retry
                        throw error;
                    }
                }
            }
            
            throw lastError;
        }

        async function handleDeleteEquipment(equipmentName) {
            console.log("handleDeleteEquipment called for:", equipmentName);
            if (!equipmentData.hasOwnProperty(equipmentName)) {
                alert("Equipamento não encontrado para apagar.");
                console.error("Equipamento não encontrado para apagar:", equipmentName);
                return;
            }
            
            if (!confirm(`Tem a certeza que quer apagar o equipamento "${equipmentName}"?`)) {
                return;
            }

            // Find the delete button and show loading state
            const deleteButton = document.querySelector(`button[onclick="handleDeleteEquipment('${equipmentName}')"]`);
            const originalButtonContent = deleteButton ? deleteButton.innerHTML : null;
            if (deleteButton) {
                deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A apagar...';
                deleteButton.disabled = true;
            }

            try {
                const result = await deleteEquipmentWithRetry(equipmentName);
                
                if (result.success) {
                    // Only remove from local data if database deletion was successful
                    delete equipmentData[equipmentName];
                    
                    if (currentlyEditingEquipmentName === equipmentName) {
                        currentlyEditingEquipmentName = null;
                        document.getElementById('addEquipmentForm').reset();
                        document.getElementById('imagePreview').src = 'imagens/logo-orca.png';
                        const submitButton = document.getElementById('addEquipmentForm').querySelector('button[type="submit"]');
                        submitButton.innerHTML = '<i class="fas fa-plus"></i> Adicionar';
                        submitButton.className = 'add';
                        
                        const cancelButton = document.getElementById('cancelEditBtn');
                        if (cancelButton) {
                            cancelButton.remove();
                        }
                    }
                    
                    displayEquipmentList(document.getElementById('searchEquipmentInput').value); 
                    populateEquipmentDropdowns();
                    alert('Equipamento apagado com sucesso!');
                } else {
                    throw new Error(result.error || 'Erro desconhecido ao apagar equipamento');
                }
                
            } catch (error) {
                console.error('Erro ao apagar equipamento:', error);
                
                // Provide user-friendly error messages
                let userMessage = error.message;
                if (error.message.toLowerCase().includes('508') || error.message.toLowerCase().includes('resource limit')) {
                    userMessage = 'O servidor está temporariamente sobrecarregado. Tente novamente em alguns minutos.';
                } else if (error.message.toLowerCase().includes('failed to fetch')) {
                    userMessage = 'Problema de conexão. Verifique sua internet e tente novamente.';
                }
                
                alert(`Erro ao apagar equipamento: ${userMessage}`);
            } finally {
                // Restore button state
                if (deleteButton && originalButtonContent) {
                    deleteButton.innerHTML = originalButtonContent;
                    deleteButton.disabled = false;
                }
            }
        }

        // handleSaveChangesToJson function removed - no longer needed for individual deletions
        // Equipment changes are now handled directly through specific API endpoints

        function populateEquipmentDropdowns() {
            const itemDivs = document.querySelectorAll('#items .item');
            itemDivs.forEach((itemDiv) => { 
                const nameInput = itemDiv.querySelector('input[id^="name"]'); 
                const priceInput = itemDiv.querySelector('input[id^="price"]');  

                if (nameInput && nameInput.tagName === 'INPUT' && priceInput) { 
                    const currentNameValue = nameInput.value;
                    if (currentNameValue && !equipmentData.hasOwnProperty(currentNameValue)) {
                        nameInput.value = '';
                        priceInput.value = '';
                        priceInput.dataset.originalIvaInclusivePrice = '';
                        priceInput.dataset.manualOverride = 'false';
                        console.log(`Cleared name/price for calculator item previously set to deleted/renamed equipment: "${currentNameValue}"`);
                    }
                }
            });
            update(); 
        }

        function setupBackToTopButton() {
            const backToTopBtn = document.getElementById("backToTopBtn");
            if (!backToTopBtn) return;

            const scrollFunction = () => {
                const equipmentTab = document.getElementById('equipmentManagementSection');
                if (equipmentTab && equipmentTab.classList.contains('active') && (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100)) {
                    backToTopBtn.style.display = "block";
                } else {
                    backToTopBtn.style.display = "none";
                }
            };

            window.addEventListener('scroll', scrollFunction);

            // Also check on tab click
            document.querySelectorAll('.tab-link').forEach(tab => {
                tab.addEventListener('click', () => {
                     // Use a short timeout to allow the tab's active class to update
                    setTimeout(scrollFunction, 50);
                });
            });

            backToTopBtn.addEventListener("click", () => {
                window.scrollTo({top: 0, behavior: 'smooth'});
            });
        }

        // Dark Mode Toggle Functionality
        function initializeTheme() {
            const themeToggle = document.getElementById('themeToggle');
            const savedTheme = localStorage.getItem('theme') || 'light';
            
            // Apply saved theme
            document.documentElement.setAttribute('data-theme', savedTheme);
            
            // Toggle theme
            themeToggle.addEventListener('click', function() {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                
                // Add a nice transition effect
                document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
                setTimeout(() => {
                    document.body.style.transition = '';
                }, 300);
            });
        }
        
        function initializeFileUpload() {
            const fileInput = document.getElementById('newEquipImage');
            const customFileButton = document.getElementById('customFileButton');
            const clearImageButton = document.getElementById('clearImageButton');
            const selectedFileName = document.getElementById('selectedFileName');
            const imagePreview = document.getElementById('imagePreview');

            // Custom file button click
            customFileButton.addEventListener('click', function() {
                fileInput.click();
            });

            // File selection
            fileInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    const file = this.files[0];
                    selectedFileName.textContent = file.name;
                    clearImageButton.style.display = 'flex';
                    
                    // Show preview
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        imagePreview.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                } else {
                    clearFileSelection();
                }
            });

            // Clear file selection
            clearImageButton.addEventListener('click', function() {
                clearFileSelection();
            });

            function clearFileSelection() {
                fileInput.value = '';
                selectedFileName.textContent = '';
                clearImageButton.style.display = 'none';
                imagePreview.src = 'imagens/logo-orca.png';
            }

            // Cancel add equipment button
            const cancelAddButton = document.getElementById('cancelAddButton');
            cancelAddButton.addEventListener('click', function() {
                // Reset form
                document.getElementById('addEquipmentForm').reset();
                clearFileSelection();
                
                // Reset editing state if applicable
                if (currentlyEditingEquipmentName) {
                    cancelEditEquipment();
                }
                
                // Focus on name input
                document.getElementById('newEquipName').focus();
            });
        }

        document.addEventListener('DOMContentLoaded', function() {
            // Verificar se o app já foi inicializado pela função checkPasswordAndShowApp()
            // Se não foi, inicializar aqui
            if (!window.appInitialized) {
                initializeApp();
                window.appInitialized = true;
            }
            displayEquipmentList();
            setupBackToTopButton();
            initializeTheme();
            initializeFileUpload();

            // Remover este bloco para evitar o registro duplicado do event listener
            // const addEquipmentForm = document.getElementById('addEquipmentForm');
            // if(addEquipmentForm) {
            //     addEquipmentForm.addEventListener('submit', handleAddNewEquipment);
            // }
        });

        // --- Helper functions to compute time spans when building the export ---
        function calcDaysBetween(fromDateStr, toDateStr) {
            if (!fromDateStr || !toDateStr) return 1;
            const f = new Date(fromDateStr);
            const t = new Date(toDateStr);
            if (isNaN(f.getTime()) || isNaN(t.getTime())) return 1;
            const diffDays = (t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24) + 1;
            return diffDays > 0 ? Math.ceil(diffDays) : 1;
        }

        function calcHoursBetween(fromTimeStr, toTimeStr) {
            if (!fromTimeStr || !toTimeStr) return 0;
            const [fh, fm] = fromTimeStr.split(':').map(Number);
            const [th, tm] = toTimeStr.split(':').map(Number);
            if ([fh, fm, th, tm].some(n => isNaN(n))) return 0;
            let fromMins = fh * 60 + fm;
            let toMins = th * 60 + tm;
            if (toMins < fromMins) toMins += 24 * 60; // across midnight
            const minutes = toMins - fromMins;
            return minutes < 0 ? 0 : minutes / 60;
        }