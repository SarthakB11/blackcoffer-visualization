from setuptools import setup, find_packages

setup(
    name="visualization-dashboard",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'flask==2.0.1',
        'flask-cors==3.0.10',
        'pymongo==3.12.0',
        'python-dotenv==0.19.0',
        'pandas==1.3.3',
        'numpy==1.21.2'
    ],
) 