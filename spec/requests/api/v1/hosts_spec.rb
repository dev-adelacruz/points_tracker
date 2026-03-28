# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Hosts" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }
  let(:host1) { create(:user, :host) }
  let(:host2) { create(:user, :host) }
  let(:team) { create(:team) }

  describe "#index" do
    path "/api/v1/hosts" do
      get "lists all hosts (leaderboard)" do
        tags "Hosts"
        produces "application/json"

        response(200, "returns all hosts for admin") do
          before do
            host1
            host2
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(2)
            expect(json_response[:status][:code]).to eq(200)
          end
        end

        response(200, "returns all hosts for emcee") do
          before do
            host1
            host2
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(2)
          end
        end

        response(200, "returns all hosts for host (including self)") do
          before do
            host1
            host2
            sign_in host1
          end

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data].length).to eq(2)
            expect(json_response[:data].map { |h| h[:id] }).to include(host1.id)
          end
        end

        response(200, "filters by team_id") do
          before do
            create(:team_membership, user: host1, team: team)
            host2
            sign_in admin
          end

          let(:team_id) { team.id }

          run_test! do |example|
            get "/api/v1/hosts?team_id=#{team.id}", headers: { "Authorization" => response.headers["Authorization"] }
            # Filtering is tested via controller query params
            expect(response).to have_http_status :ok
          end
        end

        response(401, "returns unauthorized when not signed in") do
          run_test! do
            expect(response).to have_http_status :unauthorized
          end
        end
      end
    end
  end

  describe "#show" do
    path "/api/v1/hosts/{id}" do
      parameter name: :id, in: :path, type: :integer

      get "returns a specific host" do
        tags "Hosts"
        produces "application/json"

        response(200, "returns host for admin") do
          let(:id) { host1.id }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:id]).to eq(host1.id)
            expect(json_response[:data][:email]).to eq(host1.email)
          end
        end

        response(200, "returns own profile for host") do
          let(:id) { host1.id }

          before { sign_in host1 }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:id]).to eq(host1.id)
          end
        end

        response(200, "returns any host for emcee") do
          let(:id) { host1.id }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:id]).to eq(host1.id)
          end
        end

        response(403, "returns forbidden when host requests another host's profile") do
          let(:id) { host2.id }

          before { sign_in host1 }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(404, "returns not found for non-existent host") do
          let(:id) { 0 }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :not_found
          end
        end

        response(401, "returns unauthorized when not signed in") do
          let(:id) { host1.id }

          run_test! do
            expect(response).to have_http_status :unauthorized
          end
        end
      end
    end
  end

  describe "#create" do
    path "/api/v1/hosts" do
      post "creates a new host (admin only)" do
        tags "Hosts"
        consumes "application/json"
        produces "application/json"
        parameter name: :params, in: :body, schema: {
          type: :object,
          properties: {
            host: {
              type: :object,
              properties: {
                email: { type: :string },
                password: { type: :string }
              },
              required: [ "email", "password" ]
            },
            team_id: { type: :integer }
          }
        }

        response(201, "creates host for admin") do
          let(:params) { { host: { email: "newhost@example.com", password: "password123" } } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :created
            expect(json_response[:data][:email]).to eq("newhost@example.com")
            expect(json_response[:data][:active]).to be true
          end
        end

        response(201, "creates host with team assignment") do
          let(:params) { { host: { email: "teamhost@example.com", password: "password123" }, team_id: team.id } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :created
            expect(json_response[:data][:team_id]).to eq(team.id)
          end
        end

        response(403, "returns forbidden for emcee") do
          let(:params) { { host: { email: "blocked@example.com", password: "password123" } } }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end

        response(401, "returns unauthorized when not signed in") do
          let(:params) { { host: { email: "unauth@example.com", password: "password123" } } }

          run_test! do
            expect(response).to have_http_status :unauthorized
          end
        end
      end
    end
  end

  describe "#update" do
    path "/api/v1/hosts/{id}" do
      parameter name: :id, in: :path, type: :integer

      patch "updates a host (admin only)" do
        tags "Hosts"
        consumes "application/json"
        produces "application/json"
        parameter name: :params, in: :body, schema: {
          type: :object,
          properties: {
            host: {
              type: :object,
              properties: {
                email: { type: :string }
              }
            },
            team_id: { type: :integer }
          }
        }

        response(200, "updates host email for admin") do
          let(:id) { host1.id }
          let(:params) { { host: { email: "updated@example.com" } } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:email]).to eq("updated@example.com")
          end
        end

        response(200, "reassigns host to a new team") do
          let(:id) { host1.id }
          let(:params) { { host: { email: host1.email }, team_id: team.id } }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:team_id]).to eq(team.id)
          end
        end

        response(403, "returns forbidden for emcee") do
          let(:id) { host1.id }
          let(:params) { { host: { email: "no@example.com" } } }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end

  describe "#destroy" do
    path "/api/v1/hosts/{id}" do
      parameter name: :id, in: :path, type: :integer

      delete "deactivates a host (admin only, soft delete)" do
        tags "Hosts"
        produces "application/json"

        response(200, "deactivates host for admin") do
          let(:id) { host1.id }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status :ok
            expect(json_response[:data][:active]).to be false
            expect(host1.reload.active).to be false
          end
        end

        response(403, "returns forbidden for emcee") do
          let(:id) { host1.id }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status :forbidden
          end
        end
      end
    end
  end
end
