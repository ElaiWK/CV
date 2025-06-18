<?php
// Set UTF-8 encoding for proper character handling
mb_internal_encoding('UTF-8');
mb_http_output('UTF-8');

require_once 'config.php';

handleCORS();

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Get the endpoint from the URL
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

try {
    switch ($endpoint) {
        case 'equipment_data':
            handleEquipmentData();
            break;
        
        case 'transportation_fees':
            handleTransportationFees();
            break;
        
        case 'payment_conditions':
            handlePaymentConditions();
            break;
        
        case 'payment_methods':
            handlePaymentMethods();
            break;
        
        case 'add_equipment':
            if ($method === 'POST') {
                handleAddEquipment();
            } else {
                sendJSON(['error' => 'Method not allowed'], 405);
            }
            break;
        
        case 'save_equipment':
            if ($method === 'POST') {
                handleSaveEquipmentChanges();
            } else {
                sendJSON(['error' => 'Method not allowed'], 405);
            }
            break;
        
        case 'delete_equipment':
            if ($method === 'POST') {
                handleDeleteEquipment();
            } else {
                sendJSON(['error' => 'Method not allowed'], 405);
            }
            break;
        
        case 'quotes':
            if ($method === 'GET') {
                handleGetQuotes();
            } else {
                sendJSON(['error' => 'Method not allowed'], 405);
            }
            break;
        
        case 'save_quote':
            if ($method === 'POST') {
                handleSaveQuote();
            } else {
                sendJSON(['error' => 'Method not allowed'], 405);
            }
            break;
        
        case 'delete_quote':
            if ($method === 'POST') {
                handleDeleteQuote();
            } else {
                sendJSON(['error' => 'Method not allowed'], 405);
            }
            break;
        
        default:
            sendJSON(['error' => 'Endpoint not found'], 404);
    }
} catch (Exception $e) {
    sendJSON(['error' => $e->getMessage()], 500);
}

function handleEquipmentData() {
    $pdo = getDBConnection();
    
    if (!$pdo) {
        // Return dummy data if database connection fails
        $dummyData = [
            'Jumper' => ['price' => 150.00, 'description' => 'Insufável básico para crianças', 'image_url' => 'jumper.png'],
            'Castelo' => ['price' => 180.00, 'description' => 'Castelo insuflável colorido', 'image_url' => 'castelo.png'],
            'Escorregão' => ['price' => 200.00, 'description' => 'Escorrega insuflável grande', 'image_url' => 'escorregao.png'],
            'Piscina de Bolas' => ['price' => 120.00, 'description' => 'Piscina com bolas coloridas', 'image_url' => 'piscina-de-bolas.png'],
            'Touro Mecânico' => ['price' => 250.00, 'description' => 'Diversão garantida!', 'image_url' => 'touro-mecanico.png']
        ];
        sendJSON($dummyData);
        return;
    }
    
    $stmt = $pdo->query("SELECT name, price, description, image_url FROM equipment ORDER BY name ASC");
    $equipment = $stmt->fetchAll();
    
    // Format data to match the original JSON structure
    $equipmentData = [];
    foreach ($equipment as $item) {
        $equipmentData[$item['name']] = [
            'price' => (float)$item['price'],
            'description' => $item['description'],
            'image_url' => $item['image_url']
        ];
    }
    
    sendJSON($equipmentData);
}

function handleTransportationFees() {
    $pdo = getDBConnection();
    
    if (!$pdo) {
        // Return dummy data if database connection fails
        $dummyData = [
            'Nenhuma' => 0,
            'Lisboa' => 35.00,
            'Sintra' => 45.00,
            'Cascais' => 50.00,
            'Porto' => 85.00,
            'Faro' => 120.00
        ];
        sendJSON($dummyData);
        return;
    }
    
    $stmt = $pdo->query("SELECT location, fee FROM transportation_fees ORDER BY location ASC");
    $fees = $stmt->fetchAll();
    
    // Format data to match the original JSON structure
    $feesData = [];
    foreach ($fees as $fee) {
        $feesData[$fee['location']] = (float)$fee['fee'];
    }
    
    sendJSON($feesData);
}

function handlePaymentConditions() {
    $pdo = getDBConnection();
    
    if (!$pdo) {
        // Return dummy data if database connection fails
        $dummyData = [
            [
                'value' => '50-50',
                'label' => '50% na adjudicação, 50% na montagem',
                'exportText' => '50% de sinal na adjudicação, restantes 50% até à montagem.',
                'htmlId' => 'condPag5050',
                'defaultChecked' => true
            ],
            [
                'value' => '100',
                'label' => '100% na montagem',
                'exportText' => '100% no dia do evento, antes da montagem.',
                'htmlId' => 'condPag100',
                'defaultChecked' => false
            ]
        ];
        sendJSON($dummyData);
        return;
    }
    
    $stmt = $pdo->query("SELECT value, label, export_text, html_id, is_default FROM payment_conditions ORDER BY id ASC");
    $conditions = $stmt->fetchAll();
    
    // Format data to match the original JSON structure
    $conditionsData = [];
    foreach ($conditions as $condition) {
        $conditionsData[] = [
            'value' => $condition['value'],
            'label' => $condition['label'],
            'exportText' => $condition['export_text'],
            'htmlId' => $condition['html_id'],
            'defaultChecked' => (bool)$condition['is_default']
        ];
    }
    
    sendJSON($conditionsData);
}

function handlePaymentMethods() {
    $pdo = getDBConnection();
    
    if (!$pdo) {
        // Return dummy data if database connection fails
        $dummyData = [
            [
                'id' => 'metPagDinheiro',
                'label' => 'Dinheiro',
                'exportText' => 'Dinheiro (em mãos)',
                'defaultChecked' => true
            ],
            [
                'id' => 'metPagMbway',
                'label' => 'MB Way',
                'exportText' => 'MB Way para o contacto 912345678',
                'defaultChecked' => true
            ],
            [
                'id' => 'metPagTransf',
                'label' => 'Transferência Bancária',
                'exportText' => 'Transferência bancária para o IBAN PT50 1234 5678 9012 3456 7890 1',
                'defaultChecked' => true
            ],
            [
                'id' => 'metPagCheque',
                'label' => 'Cheque',
                'exportText' => 'Cheque à ordem de Dynamic Kids, Lda.',
                'defaultChecked' => false
            ]
        ];
        sendJSON($dummyData);
        return;
    }
    
    $stmt = $pdo->query("SELECT method_id, label, export_text, is_default FROM payment_methods ORDER BY id ASC");
    $methods = $stmt->fetchAll();
    
    // Format data to match the original JSON structure
    $methodsData = [];
    foreach ($methods as $method) {
        $methodsData[] = [
            'id' => $method['method_id'],
            'label' => $method['label'],
            'exportText' => $method['export_text'],
            'defaultChecked' => (bool)$method['is_default']
        ];
    }
    
    sendJSON($methodsData);
}

function handleAddEquipment() {
    $pdo = getDBConnection();
    
    // Validate input and decode URI components
    $name = trim(urldecode($_POST['name'] ?? ''));
    $price = floatval($_POST['price'] ?? 0);
    $description = trim(urldecode($_POST['description'] ?? ''));
    $currentlyEditingName = trim($_POST['currently_editing_name'] ?? '');
    $existingImageUrl = trim($_POST['existing_image_url'] ?? '');
    
    if (empty($name) || $price <= 0) {
        sendJSON(['error' => 'Nome e preço válido são obrigatórios'], 400);
    }
    
    // Handle image upload
    $imageUrl = $existingImageUrl;
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadErrors = validateFile($_FILES['image']);
        if (!empty($uploadErrors)) {
            sendJSON(['error' => implode(', ', $uploadErrors)], 400);
        }
        
        $originalName = $_FILES['image']['name'];
        $sanitizedName = sanitizeFilename($originalName);
        $uploadPath = UPLOAD_DIR . $sanitizedName;
        
        // Create upload directory if it doesn't exist
        if (!is_dir(UPLOAD_DIR)) {
            mkdir(UPLOAD_DIR, 0755, true);
        }
        
        // Handle duplicate filenames
        $counter = 1;
        $baseName = pathinfo($sanitizedName, PATHINFO_FILENAME);
        $extension = pathinfo($sanitizedName, PATHINFO_EXTENSION);
        
        while (file_exists($uploadPath)) {
            $sanitizedName = $baseName . '_' . $counter . '.' . $extension;
            $uploadPath = UPLOAD_DIR . $sanitizedName;
            $counter++;
        }
        
        if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadPath)) {
            $imageUrl = $sanitizedName;
        } else {
            sendJSON(['error' => 'Failed to upload image'], 500);
        }
    }
    
    try {
        if (!empty($currentlyEditingName)) {
            // Update existing equipment
            $stmt = $pdo->prepare("UPDATE equipment SET name = ?, price = ?, description = ?, image_url = ? WHERE name = ?");
            $stmt->execute([$name, $price, $description, $imageUrl, $currentlyEditingName]);
        } else {
            // Check if equipment already exists
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM equipment WHERE name = ?");
            $stmt->execute([$name]);
            if ($stmt->fetchColumn() > 0) {
                sendJSON(['error' => 'Equipamento com este nome já existe'], 400);
            }
            
            // Insert new equipment
            $stmt = $pdo->prepare("INSERT INTO equipment (name, price, description, image_url) VALUES (?, ?, ?, ?)");
            $stmt->execute([$name, $price, $description, $imageUrl]);
        }
        
        // Return updated equipment data
        handleEquipmentData();
        
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) { // Duplicate entry
            sendJSON(['error' => 'Equipamento com este nome já existe'], 400);
        } else {
            sendJSON(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    }
}

function handleSaveEquipmentChanges() {
    // This function handles saving all equipment changes to the database
    // For now, we'll just return success since individual operations are handled above
    sendJSON(['success' => true, 'message' => 'Changes saved successfully']);
}

function handleDeleteEquipment() {
    $input = json_decode(file_get_contents('php://input'), true);
    $equipmentName = $input['name'] ?? '';
    
    if (empty($equipmentName)) {
        sendJSON(['error' => 'Equipment name is required'], 400);
    }
    
    try {
        $pdo = getDBConnection();
        
        // Delete from database
        $stmt = $pdo->prepare("DELETE FROM equipment WHERE name = ?");
        $deleted = $stmt->execute([$equipmentName]);
        
        if ($deleted && $stmt->rowCount() > 0) {
            sendJSON(['success' => true, 'message' => 'Equipment deleted successfully']);
        } else {
            sendJSON(['success' => false, 'error' => 'Equipment not found or already deleted']);
        }
    } catch (PDOException $e) {
        error_log("Database error in delete_equipment: " . $e->getMessage());
        sendJSON(['error' => 'Database error occurred'], 500);
    }
}

function handleGetQuotes() {
    $pdo = getDBConnection();
    
    if (!$pdo) {
        // Return empty array if database connection fails
        sendJSON([]);
        return;
    }
    
    try {
        $stmt = $pdo->query("SELECT id, client_name, quote_data, date_saved FROM quotes ORDER BY date_saved DESC");
        $quotes = $stmt->fetchAll();
        
        // Format data to match the frontend structure
        $quotesData = [];
        foreach ($quotes as $quote) {
            $quoteData = json_decode($quote['quote_data'], true);
            $quoteData['id'] = (int)$quote['id'];
            
            // For new quotes, client_name is the quoteName, add it as quoteName
            // Keep clientName from the quote data (real client name from form)
            if (!isset($quoteData['quoteName'])) {
                $quoteData['quoteName'] = $quote['client_name']; // Backwards compatibility
            }
            
            $quoteData['dateSaved'] = $quote['date_saved'];
            $quotesData[] = $quoteData;
        }
        
        sendJSON($quotesData);
    } catch (PDOException $e) {
        error_log("Database error in get_quotes: " . $e->getMessage());
        sendJSON(['error' => 'Database error occurred'], 500);
    }
}

function handleSaveQuote() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendJSON(['error' => 'Invalid JSON data'], 400);
        return;
    }
    
    // Use quoteName as the identifier, fallback to clientName for backwards compatibility
    $quoteName = trim($input['quoteName'] ?? $input['clientName'] ?? '');
    $quoteData = $input;
    
    if (empty($quoteName)) {
        sendJSON(['error' => 'Quote name is required'], 400);
        return;
    }
    
    $pdo = getDBConnection();
    
    if (!$pdo) {
        sendJSON(['error' => 'Database connection failed'], 500);
        return;
    }
    
    try {
        // Check if quote with this quote name already exists
        $stmt = $pdo->prepare("SELECT id FROM quotes WHERE client_name = ?");
        $stmt->execute([$quoteName]);
        $existingQuote = $stmt->fetch();
        
        if ($existingQuote) {
            // Update existing quote
            $quoteData['id'] = (int)$existingQuote['id'];
            $stmt = $pdo->prepare("UPDATE quotes SET quote_data = ?, date_saved = NOW() WHERE client_name = ?");
            $stmt->execute([json_encode($quoteData), $quoteName]);
            $message = "Orçamento \"{$quoteName}\" atualizado com sucesso!";
        } else {
            // Insert new quote
            $stmt = $pdo->prepare("INSERT INTO quotes (client_name, quote_data, date_saved) VALUES (?, ?, NOW())");
            $stmt->execute([$quoteName, json_encode($quoteData)]);
            $quoteData['id'] = (int)$pdo->lastInsertId();
            $message = "Orçamento \"{$quoteName}\" guardado com sucesso!";
        }
        
        $quoteData['dateSaved'] = date('c'); // ISO 8601 format
        sendJSON([
            'success' => true,
            'message' => $message,
            'quote' => $quoteData
        ]);
        
    } catch (PDOException $e) {
        error_log("Database error in save_quote: " . $e->getMessage());
        sendJSON(['error' => 'Database error occurred'], 500);
    }
}

function handleDeleteQuote() {
    $input = json_decode(file_get_contents('php://input'), true);
    $quoteId = $input['id'] ?? '';
    
    if (empty($quoteId)) {
        sendJSON(['error' => 'Quote ID is required'], 400);
        return;
    }
    
    $pdo = getDBConnection();
    
    if (!$pdo) {
        sendJSON(['error' => 'Database connection failed'], 500);
        return;
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM quotes WHERE id = ?");
        $deleted = $stmt->execute([$quoteId]);
        
        if ($deleted && $stmt->rowCount() > 0) {
            sendJSON(['success' => true, 'message' => 'Quote deleted successfully']);
        } else {
            sendJSON(['success' => false, 'error' => 'Quote not found or already deleted']);
        }
    } catch (PDOException $e) {
        error_log("Database error in delete_quote: " . $e->getMessage());
        sendJSON(['error' => 'Database error occurred'], 500);
    }
}
?>