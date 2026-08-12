import random, json

# Define base categories and glitch types
categories = [
    "Artificial Intelligence", "Machine Learning", "Deep Learning", 
    "Web Development", "Data Analysis", "Cybersecurity", 
    "Blockchain", "Big Data", "Cloud Computing", "DevOps"
]

glitch_types = [
    "logic error", "data mismatch", "syntax bug", "infinite loop",
    "API timeout", "visual distortion", "security breach",
    "training failure", "deployment crash", "unexpected behavior"
]

levels = ["Beginner", "Intermediate", "Advanced"]

# Small creative descriptions (templates)
templates = [
    "A {cat} project has a {glitch}. Find the issue and fix it creatively.",
    "The system encounters a strange {glitch} during {cat}. How would you debug it?",
    "Your {cat} pipeline glitched due to {glitch}. Brainstorm innovative fixes.",
    "A mysterious {glitch} appears in your {cat} workflow. Analyze and repair.",
    "You discovered a {glitch} in the {cat} system. Present your optimized solution."
]

# Generate data
data = []
for i in range(1, 101):
    cat = random.choice(categories)
    glitch = random.choice(glitch_types)
    level = random.choice(levels)
    desc = random.choice(templates).format(cat=cat, glitch=glitch)

    data.append({
        "id": i,
        "title": f"{cat} {glitch.title()} #{i}",
        "category": cat,
        "glitchType": glitch,
        "description": desc,
        "level": level,
        "tags": [cat.split()[0], glitch.split()[0], level],
        "points": random.randint(10, 100)
    })

import os

# Ensure folder exists
os.makedirs("src/data", exist_ok=True)

# Write JSON file inside src/data
with open("src/data/glitches.json", "w") as f:
    json.dump(data, f, indent=2)

print("✅ Successfully generated 100 glitch challenges in 'src/data/glitches.json'")
