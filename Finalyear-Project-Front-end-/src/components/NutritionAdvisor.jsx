import React, { useState } from 'react';
import { Apple, Leaf, Beef, Droplets, Info, ChevronRight, ActivitySquare, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from './BackButton';
import '../styles/NutritionAdvisor.css';

const foods = [
  {
    id: 1,
    name: "Fresh Spinach",
    category: "Vegetable",
    iron: "2.7mg / 100g",
    benefits: "High in Vitamin C which aids absorption.",
    details: "Spinach is a powerhouse of non-heme iron. It also contains oxalic acid, so pairing it with citrus fruits or bell peppers significantly boosts absorption rates. It's also rich in folate and Vitamin A.",
    nutrients: ["Vitamin C", "Folate", "Fiber", "Magnesium"],
    icon: <Leaf className="food-icon-green" />,
    color: "#10b981"
  },
  {
    id: 2,
    name: "Pomegranate",
    category: "Fruit",
    iron: "0.3mg / 100g",
    benefits: "Rich in antioxidants and improves blood flow.",
    details: "While lower in absolute iron, pomegranates are essential for blood health. They stimulate hemoglobin production and improve blood circulation through high polyphenol content. Excellent for overall vascular health.",
    nutrients: ["Antioxidants", "Potassium", "Vitamin K", "Fiber"],
    icon: <Droplets className="food-icon-ruby" />,
    color: "#e11d48"
  },
  {
    id: 3,
    name: "Red Meat",
    category: "Protein",
    iron: "2.6mg / 100g",
    benefits: "Contains Heme iron, highly absorbable.",
    details: "Red meat provides heme iron, which is absorbed 2-3 times more efficiently than plant-based iron. It also provides Vitamin B12, which is critical for red blood cell formation in the bone marrow.",
    nutrients: ["Vitamin B12", "Zinc", "Protein", "Selenium"],
    icon: <Beef className="food-icon-red" />,
    color: "#ef4444"
  },
  {
    id: 4,
    name: "Lentils",
    category: "Legumes",
    iron: "3.3mg / 100g",
    benefits: "Excellent plant-based source of iron and protein.",
    details: "Lentils are the best plant-based source of iron. They are also high in prebiotic fiber, supporting a healthy gut microbiome which is essential for nutrient absorption. Low in fat and high in sustained energy.",
    nutrients: ["Plant Protein", "Complex Carbs", "Iron", "Fiber"],
    icon: <Apple className="food-icon-orange" />,
    color: "#f59e0b"
  },
  {
    id: 5,
    name: "Dark Chocolate",
    category: "Treat",
    iron: "6.7mg / 100g",
    benefits: "A delicious way to boost iron and mood.",
    details: "Dark chocolate (min 70% cocoa) is surprisingly high in iron. It also contains copper and manganese which are co-factors in hemoglobin synthesis. Flavanols help in maintaining healthy blood pressure.",
    nutrients: ["Copper", "Manganese", "Flavanols", "Iron"],
    icon: <ActivitySquare className="food-icon-purple" />,
    color: "#8b5cf6"
  }
];

const NutritionAdvisor = ({ onBack }) => {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="nutrition-advisor-view">
      <BackButton onClick={onBack} />
      
      <div className="advisor-header slide-down-fade">
        <h2>Diet & Nutrition Advisor</h2>
        <p>Optimize your hemoglobin levels through iron-rich superfoods</p>
      </div>

      <div className="health-tip-banner mb-6">
        <Info size={20} />
        <p><strong>Pro Tip:</strong> Pair iron-rich foods with Vitamin C (like lemons or oranges) to increase absorption by up to 300%!</p>
      </div>

      <motion.div layout className="food-grid">
        <AnimatePresence>
          {foods.map((food) => (
            <motion.div 
              layout
              key={food.id} 
              className={`food-card glass-card-na ${expandedId === food.id ? 'expanded' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="food-card-content">
                <div className="food-card-top">
                  <div className="food-icon-box" style={{ backgroundColor: `${food.color}15`, borderColor: `${food.color}30` }}>
                    {food.icon}
                  </div>
                  <span className="food-category">{food.category}</span>
                </div>
                
                <h3 className="food-name">{food.name}</h3>
                
                <div className="iron-badge">
                  <Droplets size={14} />
                  <span>{food.iron}</span>
                </div>

                <p className="food-benefits">{food.benefits}</p>

                <AnimatePresence>
                  {expandedId === food.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="expanded-details"
                    >
                      <div className="details-divider"></div>
                      <p className="detailed-text">{food.details}</p>
                      <div className="nutrient-tags">
                        {food.nutrients.map((n, i) => (
                          <span key={i} className="nutrient-tag">
                            <CheckCircle2 size={12} /> {n}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  className={`learn-more-link ${expandedId === food.id ? 'active' : ''}`}
                  onClick={() => toggleExpand(food.id)}
                >
                  {expandedId === food.id ? 'Show Less' : 'Read More'} 
                  <motion.span 
                    animate={{ rotate: expandedId === food.id ? 90 : 0 }}
                    style={{ display: 'inline-block', marginLeft: '4px' }}
                  >
                    <ChevronRight size={14} />
                  </motion.span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <div className="avoid-section mt-10">
        <h4 className="section-title">What to Avoid (Close to Meals)</h4>
        <div className="avoid-items">
          <div className="avoid-item glass-card-na">
            <strong className="text-ruby" style={{ display: 'block', marginBottom: '4px' }}>Tea & Coffee</strong>
            <span>Contains tannins that block iron absorption.</span>
          </div>
          <div className="avoid-item glass-card-na">
            <strong className="text-ruby" style={{ display: 'block', marginBottom: '4px' }}>Calcium Supplements</strong>
            <span>Can compete with iron for absorption.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionAdvisor;
