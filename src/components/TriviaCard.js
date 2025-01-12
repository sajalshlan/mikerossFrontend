import React from 'react';
import { Card, Typography } from 'antd';

const { Text, Title } = Typography;

const triviaData = [
  // Document Interaction
  { title: "Select & Learn", fact: "Simply select any text in your document to instantly get explanations or start a focused brainstorming session about that specific section." },
  { title: "Multi-Document Analysis", fact: "Choose multiple documents from the sidebar and generate comparative summaries, risk analyses, or conflict checks with just one click." },
  { title: "Smart Chat", fact: "Chat naturally with your documents - select specific text to ask focused questions or discuss the entire document with full context awareness." },
  { title: "Instant Explanations", fact: "Highlight any legal term, clause, or section to get immediate, context-aware explanations in seconds." },
  
  // Document Analysis
  { title: "Quick Summaries", fact: "Select one or more files from your sidebar and get instant AI-generated summaries - from brief overviews to detailed analyses." },
  { title: "Risk Scanning", fact: "Upload your documents and let Cornelia automatically highlight potential risks, obligations, and critical clauses that need your attention." },
  { title: "Conflict Detection", fact: "Check for conflicts across multiple agreements by selecting the documents you want to compare - Cornelia will identify inconsistencies automatically." },
  
];

const TriviaCard = React.memo(() => {
  const randomTrivia = triviaData[Math.floor(Math.random() * triviaData.length)];

  return (
    <Card 
      className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
      style={{ 
        width: '100%',
        maxWidth: '800px',
        height: '400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
      bodyStyle={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4rem',
        position: 'relative',
        zIndex: 1
      }}
    >
      <div className="flex flex-col items-center justify-center space-y-8 w-full">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
        <Title 
          level={3} 
          className="text-blue-700 text-center m-0 font-bold tracking-wide"
          style={{ 
            fontSize: '2rem',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {randomTrivia.title}
        </Title>
        <Text 
          className="text-gray-700 text-center max-w-2xl leading-relaxed"
          style={{ 
            fontSize: '1.25rem',
            lineHeight: '1.8',
            fontWeight: '400',
            letterSpacing: '0.2px'
          }}
        >
          {randomTrivia.fact}
        </Text>
        <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-400" />
      </div>
    </Card>
  );
}, () => true);

export default TriviaCard; 