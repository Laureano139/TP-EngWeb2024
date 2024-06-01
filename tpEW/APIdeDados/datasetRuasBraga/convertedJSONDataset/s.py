import json
from collections import OrderedDict


# Load JSON data from a file
with open('ruas.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Function to update the data structure
def update_structure(data):
    updated_data = []
    for idx, item in enumerate(data, start=1):
        # Create a new ordered dictionary
        new_item = OrderedDict()
        # Add '_id' at the beginning
        new_item['_id'] = str(idx)
        # Copy the rest of the items ensuring 'numero' is a string
        new_item['numero'] = str(item['numero'])
        for key, value in item.items():
            if key not in ['_id', 'numero']:
                new_item[key] = value
        
        # Convert all figures' '_id' to strings
        for figura in new_item.get('figuras', []):
            figura['_id'] = str(figura['_id'])
        
        # Convert all 'casas' numbers and their nested data to strings
        for casa in new_item.get('casas', []):
            casa['numero'] = str(casa['numero'])
        
        updated_data.append(new_item)
    
    return updated_data

# Update the structure
updated_data = update_structure(data)

# Save the updated data back to a file
with open('updated_data.json', 'w', encoding='utf-8') as file:
    json.dump(updated_data, file, ensure_ascii=False, indent=4)

print("JSON data has been updated and saved to 'updated_data.json'")