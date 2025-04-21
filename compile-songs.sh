#!/bin/bash

input_folder="db/"
output_file="db/songs.json"

sorted_files=$(ls "$input_folder"/*.json | sort -V)

jq -s '.' $sorted_files > "$output_file"

echo "Combined songs written to $output_file"

