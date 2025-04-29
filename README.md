# Simulador de Perceptron

Uma aplicação web interativa que demonstra o funcionamento do Perceptron de Frank Rosenblatt, um dos primeiros algoritmos de aprendizado de máquina.

## 🚀 Como Usar

1. Clone este repositório ou baixe os arquivos
2. Abra o arquivo `index.html` em seu navegador
3. Interaja com a aplicação:
   - Clique no canvas para adicionar pontos
   - Use os botões para controlar o treinamento
   - Ajuste a taxa de aprendizado com o controle deslizante

## 🎯 Funcionalidades

- **Canvas Interativo**: Adicione pontos clicando no canvas
- **Geração de Dados**: Crie conjuntos de dados aleatórios
- **Treinamento Controlado**: Treine o modelo uma época por vez ou até a convergência
- **Visualização em Tempo Real**: Observe a reta de decisão se ajustando
- **Métricas de Desempenho**: Acompanhe os pesos, taxa de erro e acurácia

## 📚 Conceitos Educacionais

### O que é um Perceptron?

O Perceptron é um algoritmo de aprendizado supervisionado que aprende a classificar dados em duas classes. Ele foi proposto por Frank Rosenblatt em 1957 e é considerado um dos primeiros modelos de redes neurais artificiais.

### Como Funciona?

1. **Entrada**: O Perceptron recebe entradas (neste caso, coordenadas x e y)
2. **Pesos**: Cada entrada tem um peso associado
3. **Soma Ponderada**: Calcula a soma ponderada das entradas
4. **Função de Ativação**: Aplica uma função de ativação (step function) para produzir a saída
5. **Aprendizado**: Ajusta os pesos com base no erro de classificação

### Aprendizado

O Perceptron aprende através do algoritmo de aprendizado do Perceptron:
1. Para cada ponto de treinamento:
   - Faz uma predição
   - Calcula o erro (diferença entre o valor real e o previsto)
   - Ajusta os pesos proporcionalmente ao erro e à taxa de aprendizado

## 🛠️ Tecnologias Utilizadas

- HTML5
- CSS3 (com suporte a modo escuro)
- JavaScript (ES6+)
- Canvas API para renderização

## 📝 Notas de Implementação

- A aplicação é puramente client-side, sem dependências externas
- O código é modular e segue boas práticas de programação
- A interface é responsiva e suporta diferentes tamanhos de tela

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir melhorias
- Adicionar novas funcionalidades

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes. 